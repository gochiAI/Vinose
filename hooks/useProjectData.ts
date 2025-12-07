import { useState, useCallback, useEffect, useRef } from 'react';
import { debounce } from 'lodash';
import { ProjectData, Character, Location, Item, Scene, SceneEvent, DbItemType, EventType, DialogueEvent, ActionEvent, BackgroundChangeEvent, Relationship, GoToSceneEvent, Memo, Task, Asset, AssetType, Plot, SfxEvent, Variable, VariableType, BranchEvent, BranchMode, Group, BranchInfo } from '../types';
import { getProjectDataFromDB, saveProjectDataToDB } from '../utils/db';
import { useAuth } from '../contexts/AuthContext';
import { getFirestore, doc, onSnapshot, setDoc, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { firebaseApp } from '../firebase';

export const getInitialData = (): ProjectData => ({
  projectName: "New Visual Novel",
  characters: [{ id: 'char-1', name: 'Protagonist', description: 'The main character of the story.', properties: [] }],
  locations: [{ id: 'loc-1', name: 'Starting Room', description: 'A dimly lit, small room.', properties: [] }],
  items: [{ id: 'item-1', name: 'Mysterious Key', description: 'An old key with an intricate design.', properties: [] }],
  memos: [],
  tasks: [],
  plots: [],
  groups: [],
  scenes: [{ 
    id: 'scene-1', 
    title: 'Opening Scene', 
    events: [
        { id: 'event-1', type: EventType.BACKGROUND_CHANGE, backgroundAssetId: '' },
        { id: 'event-2', type: EventType.DIALOGUE, characterId: 'char-1', text: 'Where am I...?' },
        { id: 'event-3', type: EventType.ACTION, description: 'The protagonist looks around the room, trying to get their bearings.' }
    ] 
  }],
  relationships: [],
  assets: [],
  variables: [],
});

// This function ensures that any loaded project data (from DB or file)
// has all the necessary top-level keys, preventing crashes on older data structures.
const ensureDataCompleteness = (data: Partial<ProjectData>): ProjectData => {
    const defaults: ProjectData = {
        projectName: "New Visual Novel",
        characters: [],
        locations: [],
        items: [],
        memos: [],
        tasks: [],
        plots: [],
        groups: [],
        scenes: [],
        relationships: [],
        assets: [],
        variables: [],
    };
    return {
        projectName: data.projectName ?? defaults.projectName,
        characters: data.characters ?? defaults.characters,
        locations: data.locations ?? defaults.locations,
        items: data.items ?? defaults.items,
        memos: data.memos ?? defaults.memos,
        tasks: data.tasks ?? defaults.tasks,
        plots: data.plots ?? defaults.plots,
        groups: data.groups ?? defaults.groups,
        scenes: data.scenes ?? defaults.scenes,
        relationships: data.relationships ?? defaults.relationships,
        assets: data.assets ?? defaults.assets,
        variables: data.variables ?? defaults.variables,
    };
};

export const useProjectData = () => {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [currentBranch, setCurrentBranch] = useState<string>('draft');
  const [detachedHead, setDetachedHead] = useState<string | null>(null); // チェックアウトしたコミットID
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // ローカルとFirestoreの差分
  const { user, loading: authLoading } = useAuth();
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false); // 保存中の状態を管理
  const lastFirestoreData = useRef<ProjectData | null>(null); // 最後にFirestoreから取得したデータ
  const isLocalUpdateRef = useRef(false); // ローカル更新による保存かどうか

  // デバウンス付きの保存処理
  const debouncedSaveToFirestore = useCallback(
    debounce(async (data: ProjectData, branch: string) => {
      if (!user || !firebaseApp) return;

      // 最後に保存したデータと同じ場合はスキップ
      if (lastFirestoreData.current && JSON.stringify(lastFirestoreData.current) === JSON.stringify(data)) {
        console.log('Data unchanged, skipping Firestore write');
        return;
      }

      const db = getFirestore(firebaseApp);
      const branchRef = doc(db, 'projects', user.uid, 'branches', branch, 'data', 'current');

      try {
        isSavingRef.current = true; // 保存中フラグを設定
        isLocalUpdateRef.current = true; // ローカル更新フラグ
        await setDoc(branchRef, data, { merge: false }); // merge: false で完全上書き
        // ブランチのlastModifiedを更新
        const branchMetaRef = doc(db, 'projects', user.uid, 'branches', branch);
        await updateDoc(branchMetaRef, { lastModified: serverTimestamp() });
        lastFirestoreData.current = data; // 保存したデータを記録
        setHasUnsavedChanges(false); // 保存完了したので差分なし
        
        // フラグを遅延リセット（onSnapshotが発火する前にフラグを保持）
        setTimeout(() => {
          isLocalUpdateRef.current = false;
        }, 1000);
        
        console.log(`Branch '${branch}' saved to Firestore`);
      } catch (error) {
        console.error('Error saving branch to Firestore:', error);
      } finally {
        isSavingRef.current = false; // 保存中フラグを解除
      }
    }, 3000, { maxWait: 5000 }), // デバウンス時間を 3 秒、最大待機 5 秒に設定
    [user]
  );

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    setProjectData(null);

    const loadLocalData = async () => {
        const data: Partial<ProjectData> | null = await getProjectDataFromDB();
        if (data) {
            setProjectData(ensureDataCompleteness(data));
        } else {
            const initialData = getInitialData();
            await saveProjectDataToDB(initialData);
            setProjectData(initialData);
        }
    };
    
    if (authLoading) {
        return;
    }

    if (user && firebaseApp) {
        const db = getFirestore(firebaseApp);
        // 現在のブランチのデータを監視
        const branchDataRef = doc(db, 'projects', user.uid, 'branches', currentBranch, 'data', 'current');
        
        unsubscribe = onSnapshot(branchDataRef, async (docSnap) => {
            // 自分の保存による更新はスキップ
            if (isLocalUpdateRef.current || isSavingRef.current) {
                console.log('Skipping onSnapshot: local update in progress');
                return;
            }
            
            if (docSnap.exists()) {
                const cloudData = ensureDataCompleteness(docSnap.data() as Partial<ProjectData>);
                
                // データが同じ場合はスキップ
                if (lastFirestoreData.current && JSON.stringify(lastFirestoreData.current) === JSON.stringify(cloudData)) {
                    console.log('Skipping onSnapshot: data unchanged');
                    return;
                }
                
                lastFirestoreData.current = cloudData; // Firestoreデータを記録
                setProjectData(cloudData);
                setHasUnsavedChanges(false); // Firestoreと同期したので差分なし
                saveProjectDataToDB(cloudData);
            } else {
                // ブランチが存在しない場合は作成
                const branchMetaRef = doc(db, 'projects', user.uid, 'branches', currentBranch);
                const branchMetaSnap = await getDoc(branchMetaRef);
                
                if (!branchMetaSnap.exists()) {
                    // 新規ブランチを作成
                    await setDoc(branchMetaRef, {
                        name: currentBranch,
                        createdAt: serverTimestamp(),
                        lastModified: serverTimestamp(),
                    });
                }
                
                // ローカルデータまたは初期データをブランチに保存
                const localData = await getProjectDataFromDB();
                const dataToStartWith = localData ? ensureDataCompleteness(localData) : getInitialData();
                await setDoc(branchDataRef, dataToStartWith);
                setProjectData(dataToStartWith);
            }
        }, (error) => {
            console.error("Firestore listen failed:", error);
            loadLocalData();
        });

    } else {
        loadLocalData();
    }
    
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }
        // デバウンス中の保存をキャンセル
        debouncedSaveToFirestore.cancel();
    };
  }, [user, authLoading, currentBranch]);

  // タブ閉じ時の保存処理を追加
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (projectData && user && firebaseApp) {
        // デバウンス中の保存を即座に実行
        debouncedSaveToFirestore.flush();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectData, user, currentBranch]);

  // データを更新して保存
  const updateAndPersistData = useCallback(
    (updater: (prev: ProjectData) => ProjectData) => {
      setProjectData((prev) => {
        if (!prev) return null;
        const newData = updater(prev);

        saveProjectDataToDB(newData); // ローカル保存

        // Firestore に保存（デバウンス処理）
        debouncedSaveToFirestore(newData, currentBranch);
        
        // ローカルに変更があることを記録
        setHasUnsavedChanges(true);

        return newData;
      });
    },
    [debouncedSaveToFirestore, currentBranch]
  );

  // コンポーネントのアンマウント時にデバウンスをキャンセル
  useEffect(() => {
    return () => {
      debouncedSaveToFirestore.cancel();
    };
  }, [debouncedSaveToFirestore]);

  // 確定版としてバージョンを保存
  const saveVersion = useCallback(async (note?: string) => {
    if (!projectData || !user || !firebaseApp) {
      throw new Error('Cannot save version: no data or user');
    }

    const db = getFirestore(firebaseApp);
    const versionsRef = collection(db, 'projects', user.uid, 'versions');
    
    let parentId: string | null = null;
    
    if (detachedHead) {
      // detached HEAD状態: チェックアウトしたコミットを親にする
      parentId = detachedHead;
      // detached HEAD状態を解除
      setDetachedHead(null);
    } else {
      // 通常: 現在ブランチの直近のコミットIDを取得
      const latestQ = query(versionsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(latestQ);
      for (const d of snapshot.docs) {
        const data = d.data();
        if (data.branch === currentBranch) {
          parentId = d.id;
          break;
        }
      }
    }
    
    // 新しいコミットを作成
    await addDoc(versionsRef, {
      ...projectData,
      createdAt: serverTimestamp(),
      note: note || '',
      branch: currentBranch,
      parentId: parentId || null,
      mergeParentId: null,
      type: 'commit',
    });
    
    console.log('New version saved successfully');
  }, [projectData, user, currentBranch, detachedHead]);

  // 最新の確定版を読み込む
  const loadLatestVersion = useCallback(async () => {
    if (!user || !firebaseApp) {
      throw new Error('Cannot load version: no user');
    }

    const db = getFirestore(firebaseApp);
    const versionsRef = collection(db, 'projects', user.uid, 'versions');
    const q = query(versionsRef, orderBy('createdAt', 'desc'), limit(1));
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const latestDoc = querySnapshot.docs[0];
      const versionData = latestDoc.data();
      
      // createdAtとnoteを除外してProjectDataとして復元
      const { createdAt, note, ...projectDataFromVersion } = versionData;
      const restoredData = ensureDataCompleteness(projectDataFromVersion as Partial<ProjectData>);
      
      // draftを更新
      const draftRef = doc(db, 'projects', user.uid, 'draft', 'current');
      await setDoc(draftRef, restoredData);
      
      setProjectData(restoredData);
      await saveProjectDataToDB(restoredData);
      
      return restoredData;
    }
    
    throw new Error('No versions found');
  }, [user]);

  // 全バージョン履歴を取得
  const getVersionHistory = useCallback(async () => {
    if (!user || !firebaseApp) {
      return [];
    }

    const db = getFirestore(firebaseApp);
    const versionsRef = collection(db, 'projects', user.uid, 'versions');
    const q = query(versionsRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      createdAt: (doc.data() as any).createdAt,
      note: (doc.data() as any).note || '',
      projectName: (doc.data() as any).projectName,
      branch: (doc.data() as any).branch || 'draft',
      parentId: (doc.data() as any).parentId || null,
      mergeParentId: (doc.data() as any).mergeParentId || null,
      type: (doc.data() as any).type || 'commit',
    }));
  }, [user]);

  // 特定のバージョンを読み込む (soft: ブランチは変えない)
  const loadVersion = useCallback(async (versionId: string) => {
    if (!user || !firebaseApp) {
      throw new Error('Cannot load version: no user');
    }

    const db = getFirestore(firebaseApp);
    const versionRef = doc(db, 'projects', user.uid, 'versions', versionId);
    const versionDoc = await getDocs(query(collection(db, 'projects', user.uid, 'versions')));
    
    const targetDoc = versionDoc.docs.find(d => d.id === versionId);
    if (targetDoc) {
      const versionData = targetDoc.data();
      const { createdAt, note, branch, parentId, mergeParentId, type, ...projectDataFromVersion } = versionData;
      const restoredData = ensureDataCompleteness(projectDataFromVersion as Partial<ProjectData>);
      
      // 現在のブランチのデータを更新
      const branchDataRef = doc(db, 'projects', user.uid, 'branches', currentBranch, 'data', 'current');
      await setDoc(branchDataRef, restoredData);
      
      setProjectData(restoredData);
      await saveProjectDataToDB(restoredData);
      
      return restoredData;
    }
    
    throw new Error('Version not found');
  }, [user, currentBranch]);

  // 特定のバージョンにチェックアウト (hard reset: detached HEAD状態)
  const checkoutVersion = useCallback(async (versionId: string) => {
    if (!user || !firebaseApp) {
      throw new Error('Cannot checkout version: no user');
    }

    const db = getFirestore(firebaseApp);
    const versionDoc = await getDocs(query(collection(db, 'projects', user.uid, 'versions')));
    
    const targetDoc = versionDoc.docs.find(d => d.id === versionId);
    if (targetDoc) {
      const versionData = targetDoc.data();
      const { createdAt, note, branch, parentId, mergeParentId, type, ...projectDataFromVersion } = versionData;
      const restoredData = ensureDataCompleteness(projectDataFromVersion as Partial<ProjectData>);
      
      // 現在のブランチのデータを更新
      const branchDataRef = doc(db, 'projects', user.uid, 'branches', currentBranch, 'data', 'current');
      await setDoc(branchDataRef, restoredData);
      
      setProjectData(restoredData);
      await saveProjectDataToDB(restoredData);
      
      // detached HEAD状態に入る
      setDetachedHead(versionId);
      
      return restoredData;
    }
    
    throw new Error('Version not found');
  }, [user, currentBranch]);

  // 特定のバージョンを削除
  const deleteVersion = useCallback(async (versionId: string) => {
    if (!user || !firebaseApp) {
      throw new Error('Cannot delete version: no user');
    }

    const db = getFirestore(firebaseApp);
    const versionRef = doc(db, 'projects', user.uid, 'versions', versionId);

    try {
      await setDoc(versionRef, {}, { merge: false }); // バージョンを削除
      console.log(`Version ${versionId} deleted successfully`);
    } catch (error) {
      console.error('Error deleting version:', error);
      throw error;
    }
  }, [user]);

  // ブランチを作成
  const createBranch = useCallback(async (branchName: string, fromBranch?: string) => {
    if (!user || !firebaseApp) {
      throw new Error('Cannot create branch: no user');
    }

    const db = getFirestore(firebaseApp);
    const newBranchMetaRef = doc(db, 'projects', user.uid, 'branches', branchName);
    
    // ブランチが既に存在するかチェック
    const branchSnap = await getDoc(newBranchMetaRef);
    if (branchSnap.exists()) {
      throw new Error(`Branch '${branchName}' already exists`);
    }

    // 新しいブランチのメタデータを作成
    await setDoc(newBranchMetaRef, {
      name: branchName,
      createdAt: serverTimestamp(),
      lastModified: serverTimestamp(),
    });

    // ソースブランチからデータをコピー
    const sourceBranch = fromBranch || currentBranch;
    const sourceBranchDataRef = doc(db, 'projects', user.uid, 'branches', sourceBranch, 'data', 'current');
    const sourceBranchDataSnap = await getDoc(sourceBranchDataRef);
    
    if (sourceBranchDataSnap.exists()) {
      const sourceData = sourceBranchDataSnap.data();
      const newBranchDataRef = doc(db, 'projects', user.uid, 'branches', branchName, 'data', 'current');
      await setDoc(newBranchDataRef, sourceData);
    } else {
      // ソースブランチにデータがない場合は現在のprojectDataまたは初期データを使用
      const dataToUse = projectData || getInitialData();
      const newBranchDataRef = doc(db, 'projects', user.uid, 'branches', branchName, 'data', 'current');
      await setDoc(newBranchDataRef, dataToUse);
    }

    console.log(`Branch '${branchName}' created successfully`);
  }, [user, currentBranch, projectData]);

  // ブランチを切り替え
  const switchBranch = useCallback(async (branchName: string) => {
    if (!user || !firebaseApp) {
      throw new Error('Cannot switch branch: no user');
    }

    const db = getFirestore(firebaseApp);
    const branchMetaRef = doc(db, 'projects', user.uid, 'branches', branchName);
    const branchSnap = await getDoc(branchMetaRef);

    if (!branchSnap.exists()) {
      throw new Error(`Branch '${branchName}' does not exist`);
    }

    setCurrentBranch(branchName);
    console.log(`Switched to branch '${branchName}'`);
  }, [user]);

  // ブランチを削除
  const deleteBranch = useCallback(async (branchName: string) => {
    if (!user || !firebaseApp) {
      throw new Error('Cannot delete branch: no user');
    }

    if (branchName === 'draft') {
      throw new Error('Cannot delete the default draft branch');
    }

    if (branchName === currentBranch) {
      throw new Error('Cannot delete the currently active branch');
    }

    const db = getFirestore(firebaseApp);
    const branchMetaRef = doc(db, 'projects', user.uid, 'branches', branchName);
    const branchDataRef = doc(db, 'projects', user.uid, 'branches', branchName, 'data', 'current');

    try {
      // データとメタデータを削除
      await setDoc(branchDataRef, {});
      await setDoc(branchMetaRef, {});
      console.log(`Branch '${branchName}' deleted successfully`);
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw error;
    }
  }, [user, currentBranch]);

  // ブランチ一覧を取得
  const listBranches = useCallback(async (): Promise<BranchInfo[]> => {
    if (!user || !firebaseApp) {
      return [];
    }

    const db = getFirestore(firebaseApp);
    const branchesRef = collection(db, 'projects', user.uid, 'branches');
    const querySnapshot = await getDocs(branchesRef);

    const branches: BranchInfo[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.name) {
        branches.push({
          name: data.name,
          createdAt: data.createdAt,
          lastModified: data.lastModified,
        });
      }
    });

    return branches.sort((a, b) => {
      if (a.name === 'draft') return -1;
      if (b.name === 'draft') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [user]);

  // ブランチをマージ（現在のブランチに別ブランチのデータを上書き）
  const mergeBranch = useCallback(async (sourceBranchName: string) => {
    if (!user || !firebaseApp) {
      throw new Error('Cannot merge branch: no user');
    }

    const db = getFirestore(firebaseApp);
    const sourceBranchDataRef = doc(db, 'projects', user.uid, 'branches', sourceBranchName, 'data', 'current');
    const sourceBranchDataSnap = await getDoc(sourceBranchDataRef);

    if (!sourceBranchDataSnap.exists()) {
      throw new Error(`Source branch '${sourceBranchName}' has no data`);
    }

    const sourceData = ensureDataCompleteness(sourceBranchDataSnap.data() as Partial<ProjectData>);
    
    // 現在のブランチに上書き
    const currentBranchDataRef = doc(db, 'projects', user.uid, 'branches', currentBranch, 'data', 'current');
    await setDoc(currentBranchDataRef, sourceData);
    
    // 現在のブランチのlastModifiedを更新
    const branchMetaRef = doc(db, 'projects', user.uid, 'branches', currentBranch);
    await updateDoc(branchMetaRef, { lastModified: serverTimestamp() });

    setProjectData(sourceData);
    await saveProjectDataToDB(sourceData);

    // バージョン（マージコミット）として保存
    const versionsRef = collection(db, 'projects', user.uid, 'versions');
    // 現在ブランチのHEAD
    const versionsAllSnap = await getDocs(query(versionsRef, orderBy('createdAt', 'desc')));
    let currentHead: string | null = null;
    let sourceHead: string | null = null;
    for (const d of versionsAllSnap.docs) {
      const v = d.data() as any;
      if (!currentHead && v.branch === currentBranch) currentHead = d.id;
      if (!sourceHead && v.branch === sourceBranchName) sourceHead = d.id;
      if (currentHead && sourceHead) break;
    }
    await addDoc(versionsRef, {
      ...sourceData,
      createdAt: serverTimestamp(),
      note: `Merge '${sourceBranchName}' into '${currentBranch}'`,
      branch: currentBranch,
      parentId: currentHead || null,
      mergeParentId: sourceHead || null,
      type: 'merge',
    });

    console.log(`Branch '${sourceBranchName}' merged into '${currentBranch}'`);
  }, [user, currentBranch]);

  const setData = useCallback(async (data: Partial<ProjectData>) => {
    const completeData = ensureDataCompleteness(data);
    setProjectData(completeData);
    await saveProjectDataToDB(completeData);
    if (user && firebaseApp) {
        const db = getFirestore(firebaseApp);
        const branchDataRef = doc(db, 'projects', user.uid, 'branches', currentBranch, 'data', 'current');
        await setDoc(branchDataRef, completeData);
    }
  }, [user, currentBranch]);

  const resetProjectData = useCallback(async () => {
    const initialData = getInitialData();
    setProjectData(initialData);
    await saveProjectDataToDB(initialData);
     if (user && firebaseApp) {
        const db = getFirestore(firebaseApp);
        const branchDataRef = doc(db, 'projects', user.uid, 'branches', currentBranch, 'data', 'current');
        await setDoc(branchDataRef, initialData);
    }
  }, [user, currentBranch]);

  const updateProjectName = useCallback((name: string) => {
    updateAndPersistData(prev => ({...prev, projectName: name}));
  }, [updateAndPersistData]);

  const addDbItem = useCallback((type: DbItemType) => {
    let newItem: Character | Location | Item | Memo | Task | Plot | Variable | Group;
    const id = `${type.slice(0,4)}-${Date.now()}`;

    switch (type) {
        case 'memo':
            newItem = { id, title: 'New Memo', content: '', properties: [] };
            break;
        case 'task':
            newItem = { id, title: 'New Task', description: '', completed: false };
            break;
        case 'plot':
            newItem = { id, title: 'New Plot', content: '', properties: [] };
            break;
        case 'group':
            newItem = { id, title: 'New Group', color: '#808080' };
            break;
        case 'variable':
            newItem = { id, name: 'New Variable', type: VariableType.NUMBER, initialValue: 0 };
            break;
        case 'character':
        case 'location':
        case 'item':
        default:
             if (type === 'asset') return ''; // Assets are added via addAsset
            newItem = {
                id,
                name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                description: '',
                properties: [],
            };
            break;
    }

    updateAndPersistData(prev => {
        switch (type) {
            case 'character':
                return {...prev, characters: [...prev.characters, newItem as Character]};
            case 'location':
                return {...prev, locations: [...prev.locations, newItem as Location]};
            case 'item':
                return {...prev, items: [...prev.items, newItem as Item]};
            case 'memo':
                return {...prev, memos: [...prev.memos, newItem as Memo]};
            case 'task':
                return {...prev, tasks: [...prev.tasks, newItem as Task]};
            case 'plot':
                return {...prev, plots: [...prev.plots, newItem as Plot]};
            case 'group':
                return {...prev, groups: [...prev.groups, newItem as Group]};
            case 'variable':
                return {...prev, variables: [...prev.variables, newItem as Variable]};
            default:
              return prev;
        }
    });
    return newItem.id;
  }, [updateAndPersistData]);

  const updateDbItem = useCallback((type: DbItemType, updatedItem: Character | Location | Item | Memo | Task | Asset | Plot | Variable | Group) => {
    updateAndPersistData(prev => {
        switch (type) {
            case 'character':
                return {...prev, characters: prev.characters.map(c => c.id === updatedItem.id ? updatedItem as Character : c)};
            case 'location':
                return {...prev, locations: prev.locations.map(l => l.id === updatedItem.id ? updatedItem as Location : l)};
            case 'item':
                return {...prev, items: prev.items.map(i => i.id === updatedItem.id ? updatedItem as Item : i)};
            case 'memo':
                return {...prev, memos: prev.memos.map(m => m.id === updatedItem.id ? updatedItem as Memo : m)};
            case 'task':
                return {...prev, tasks: prev.tasks.map(t => t.id === updatedItem.id ? updatedItem as Task : t)};
            case 'plot':
                return {...prev, plots: prev.plots.map(p => p.id === updatedItem.id ? updatedItem as Plot : p)};
            case 'group':
                return {...prev, groups: prev.groups.map(g => g.id === updatedItem.id ? updatedItem as Group : g)};
            case 'asset':
                return {...prev, assets: prev.assets.map(a => a.id === updatedItem.id ? updatedItem as Asset : a)};
            case 'variable':
                return {...prev, variables: prev.variables.map(v => v.id === updatedItem.id ? updatedItem as Variable : v)};
            default:
                return prev;
        }
    });
  }, [updateAndPersistData]);

  const deleteDbItem = useCallback((type: DbItemType, id: string) => {
    updateAndPersistData(prev => {
        switch (type) {
            case 'character':
                return {
                    ...prev,
                    characters: prev.characters.filter(c => c.id !== id),
                    relationships: prev.relationships.filter(r => r.sourceCharacterId !== id && r.targetCharacterId !== id)
                };
            case 'location':
                return {...prev, locations: prev.locations.filter(l => l.id !== id)};
            case 'item':
                return {...prev, items: prev.items.filter(i => i.id !== id)};
            case 'memo':
                return {...prev, memos: prev.memos.filter(m => m.id !== id)};
            case 'task':
                return {...prev, tasks: prev.tasks.filter(t => t.id !== id)};
            case 'plot': {
                const newScenes = prev.scenes.map(scene => {
                    if (scene.plotId === id) {
                        const { plotId, ...rest } = scene;
                        return rest;
                    }
                    return scene;
                });
                return { 
                    ...prev, 
                    plots: prev.plots.filter(p => p.id !== id),
                    scenes: newScenes
                };
            }
            case 'group': {
                const newScenes = prev.scenes.map(scene => {
                    if (scene.groupId === id) {
                        const { groupId, ...rest } = scene;
                        return rest;
                    }
                    return scene;
                });
                return {
                    ...prev,
                    groups: prev.groups.filter(g => g.id !== id),
                    scenes: newScenes,
                };
            }
            case 'variable': {
                const newScenes = prev.scenes.map(scene => {
                    const newEvents = scene.events.map(event => {
                        const newEvent = { ...event };
                        // Clean postExecutionActions from Dialogue and Action events
                        if ((newEvent.type === EventType.DIALOGUE || newEvent.type === EventType.ACTION) && newEvent.postExecutionActions) {
                            newEvent.postExecutionActions = newEvent.postExecutionActions.filter(action => action.variableId !== id);
                        }
                        // Clean Branch events
                        if (newEvent.type === EventType.BRANCH) {
                            const branchEvent = newEvent as BranchEvent;
                            // Clean display conditions in Player Choice mode
                            if (branchEvent.mode === BranchMode.PLAYER_CHOICE && branchEvent.choices) {
                                branchEvent.choices = branchEvent.choices.map(choice => {
                                    if (choice.displayCondition?.variableId === id) {
                                        const { displayCondition, ...rest } = choice;
                                        return rest;
                                    }
                                    return choice;
                                });
                            }
                            // Clean conditions in Auto Condition mode
                            if (branchEvent.mode === BranchMode.AUTO_CONDITION && branchEvent.branches) {
                                branchEvent.branches = branchEvent.branches.filter(branch => branch.condition?.variableId !== id);
                            }
                        }
                        return newEvent as SceneEvent;
                    });
                    return { ...scene, events: newEvents };
                });
                return { ...prev, variables: prev.variables.filter(v => v.id !== id), scenes: newScenes };
            }
            case 'asset': {
                const newScenes = prev.scenes.map(scene => {
                    const newEvents = scene.events.map(event => {
                        const newEvent = { ...event };
                        if (event.type === EventType.BACKGROUND_CHANGE && event.backgroundAssetId === id) {
                            (newEvent as BackgroundChangeEvent).backgroundAssetId = '';
                        }
                        if (event.type === EventType.DIALOGUE) {
                            if (event.spriteAssetId === id) (newEvent as DialogueEvent).spriteAssetId = undefined;
                            if (event.sfxAssetId === id) (newEvent as DialogueEvent).sfxAssetId = undefined;
                        }
                        if (event.type === EventType.ACTION && event.sfxAssetId === id) {
                           (newEvent as ActionEvent).sfxAssetId = undefined;
                        }
                        if (event.type === EventType.SFX && event.sfxAssetId === id) {
                           (newEvent as SfxEvent).sfxAssetId = '';
                        }
                        return newEvent;
                    });
                    return { ...scene, events: newEvents };
                });
                return { ...prev, assets: prev.assets.filter(a => a.id !== id), scenes: newScenes };
            }
            default:
                return prev;
        }
    });
  }, [updateAndPersistData]);

  const addScene = useCallback(() => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      title: 'New Scene',
      events: []
    };
    updateAndPersistData(prev => ({...prev, scenes: [...prev.scenes, newScene]}));
    return newScene.id;
  }, [updateAndPersistData]);

  const updateScene = useCallback((updatedScene: Scene) => {
    updateAndPersistData(prev => ({...prev, scenes: prev.scenes.map(s => s.id === updatedScene.id ? updatedScene : s)}));
  }, [updateAndPersistData]);
  
  const deleteScene = useCallback((id: string) => {
    updateAndPersistData(prev => ({...prev, scenes: prev.scenes.filter(s => s.id !== id)}));
  }, [updateAndPersistData]);

  const addSceneEvent = useCallback((sceneId: string, type: EventType, index?: number) => {
    if(!projectData) return;
    const newEvent: Partial<SceneEvent> = { id: `event-${Date.now()}`, type };
    if (type === EventType.DIALOGUE) {
        (newEvent as DialogueEvent).characterId = projectData.characters[0]?.id || '';
        (newEvent as DialogueEvent).text = '';
    } else if (type === EventType.ACTION) {
        (newEvent as ActionEvent).description = '';
    } else if (type === EventType.BACKGROUND_CHANGE) {
        (newEvent as BackgroundChangeEvent).backgroundAssetId = projectData.assets.find(a => a.type === AssetType.BACKGROUND)?.id || '';
    } else if (type === EventType.BRANCH) {
        (newEvent as BranchEvent).mode = BranchMode.PLAYER_CHOICE;
        (newEvent as BranchEvent).choices = [
            { id: `choice-${Date.now()}-1`, text: 'Choice 1', nextSceneId: '' },
            { id: `choice-${Date.now()}-2`, text: 'Choice 2', nextSceneId: '' },
        ];
    } else if (type === EventType.GOTO_SCENE) {
        (newEvent as GoToSceneEvent).nextSceneId = '';
    } else if (type === EventType.SFX) {
        (newEvent as SfxEvent).sfxAssetId = projectData.assets.find(a => a.type === AssetType.SFX)?.id || '';
    }

    updateAndPersistData(prev => ({
        ...prev,
        scenes: prev.scenes.map(s => {
            if (s.id === sceneId) {
                const newEvents = [...s.events];
                if (index !== undefined && index >= 0 && index <= newEvents.length) {
                    newEvents.splice(index, 0, newEvent as SceneEvent);
                } else {
                    newEvents.push(newEvent as SceneEvent);
                }
                return {...s, events: newEvents};
            }
            return s;
        })
    }));
  }, [projectData, updateAndPersistData]);

  const addSceneEvents = useCallback((sceneId: string, newEvents: SceneEvent[]) => {
    updateAndPersistData(prev => ({
        ...prev,
        scenes: prev.scenes.map(s => {
            if (s.id === sceneId) {
                return {...s, events: [...s.events, ...newEvents]}
            }
            return s;
        })
    }));
  }, [updateAndPersistData]);

  const updateSceneEvent = useCallback((sceneId: string, updatedEvent: SceneEvent) => {
    updateAndPersistData(prev => ({
        ...prev,
        scenes: prev.scenes.map(s => {
            if (s.id === sceneId) {
                return {...s, events: s.events.map(e => e.id === updatedEvent.id ? updatedEvent : e)}
            }
            return s;
        })
    }));
  }, [updateAndPersistData]);

  const deleteSceneEvent = useCallback((sceneId: string, eventId: string) => {
    updateAndPersistData(prev => ({
        ...prev,
        scenes: prev.scenes.map(s => {
            if (s.id === sceneId) {
                return {...s, events: s.events.filter(e => e.id !== eventId)}
            }
            return s;
        })
    }));
  }, [updateAndPersistData]);

  const addRelationship = useCallback((relationship: Omit<Relationship, 'id'>) => {
    const newRelationship: Relationship = {
      ...relationship,
      id: `rel-${Date.now()}`
    };
    updateAndPersistData(prev => ({...prev, relationships: [...prev.relationships, newRelationship]}));
  }, [updateAndPersistData]);

  const updateRelationship = useCallback((updatedRelationship: Relationship) => {
    updateAndPersistData(prev => ({...prev, relationships: prev.relationships.map(r => r.id === updatedRelationship.id ? updatedRelationship : r)}));
  }, [updateAndPersistData]);

  const deleteRelationship = useCallback((id: string) => {
    updateAndPersistData(prev => ({...prev, relationships: prev.relationships.filter(r => r.id !== id)}));
  }, [updateAndPersistData]);

  const addAsset = useCallback(async (assetData: Omit<Asset, 'id'>) => {
    const newAsset: Asset = {
        id: `asset-${Date.now()}`,
        ...assetData
    };
    updateAndPersistData(prev => ({
        ...prev,
        assets: [...prev.assets, newAsset]
    }));
    return newAsset.id;
}, [updateAndPersistData]);


  return {
    projectData,
    currentBranch,
    detachedHead,
    hasUnsavedChanges,
    setData,
    resetProjectData,
    updateProjectName,
    addDbItem,
    updateDbItem,
    deleteDbItem,
    addScene,
    updateScene,
    deleteScene,
    addSceneEvent,
    addSceneEvents,
    updateSceneEvent,
    deleteSceneEvent,
    addRelationship,
    updateRelationship,
    deleteRelationship,
    addAsset,
    // バージョン管理
    saveVersion,
    loadLatestVersion,
    loadVersion,
    checkoutVersion,
    getVersionHistory,
    deleteVersion,
    // ブランチ管理
    createBranch,
    switchBranch,
    deleteBranch,
    listBranches,
    mergeBranch,
  };
};
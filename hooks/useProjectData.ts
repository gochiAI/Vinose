import { useState, useCallback, useEffect } from 'react';
import { ProjectData, Character, Location, Item, Scene, SceneEvent, DbItemType, EventType, DialogueEvent, ActionEvent, BackgroundChangeEvent, Relationship, GoToSceneEvent, Memo, Task, Asset, AssetType, Plot, SfxEvent, Variable, VariableType, BranchEvent, BranchMode, Group } from '../types';
import { getProjectDataFromDB, saveProjectDataToDB } from '../utils/db';
import { useAuth } from '../contexts/AuthContext';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
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
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    setProjectData(null); // Reset data on auth change

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
        const docRef = doc(db, 'projects', user.uid);
        unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const cloudData = ensureDataCompleteness(docSnap.data() as Partial<ProjectData>);
                setProjectData(cloudData);
                saveProjectDataToDB(cloudData); // Update local cache
            } else {
                // New user in Firestore, check if there's local data to upload
                getProjectDataFromDB().then(localData => {
                    const dataToStartWith = localData ? ensureDataCompleteness(localData) : getInitialData();
                    setDoc(docRef, dataToStartWith); // This will trigger onSnapshot again
                    setProjectData(dataToStartWith);
                });
            }
        }, (error) => {
            console.error("Firestore listen failed:", error);
            loadLocalData(); // Fallback to local on error
        });

    } else {
        loadLocalData();
    }
    
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [user, authLoading]);

  const updateAndPersistData = useCallback(async (updater: (prev: ProjectData) => ProjectData) => {
    setProjectData(prev => {
        if (!prev) return null;
        const newData = updater(prev);
        
        saveProjectDataToDB(newData); // Always persist to local DB for offline cache

        if (user && firebaseApp) {
            const db = getFirestore(firebaseApp);
            const docRef = doc(db, 'projects', user.uid);
            setDoc(docRef, newData).catch(e => console.error("Firestore save error:", e));
        }
        return newData;
    });
  }, [user]);

  const setData = useCallback(async (data: Partial<ProjectData>) => {
    const completeData = ensureDataCompleteness(data);
    setProjectData(completeData);
    await saveProjectDataToDB(completeData);
    if (user && firebaseApp) {
        const db = getFirestore(firebaseApp);
        const docRef = doc(db, 'projects', user.uid);
        await setDoc(docRef, completeData);
    }
  }, [user]);

  const resetProjectData = useCallback(async () => {
    const initialData = getInitialData();
    setProjectData(initialData);
    await saveProjectDataToDB(initialData);
     if (user && firebaseApp) {
        const db = getFirestore(firebaseApp);
        const docRef = doc(db, 'projects', user.uid);
        await setDoc(docRef, initialData);
    }
  }, [user]);

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
    addAsset
  };
};
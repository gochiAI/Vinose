import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { PlaytestOverlay } from './components/layout/PlaytestOverlay';
import { Dashboard } from './components/dashboard/Dashboard';
import { EditorView } from './components/editor/EditorView';
import { ChapterListPage } from './components/chapters/ChapterListPage';
import { CharactersPage } from './components/characters/CharactersPage';
import { AssetsPage } from './components/assets/AssetsPage';
import { DocumentsPage } from './components/documents/DocumentsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { HeaderInfo, SceneNode } from './types';
import { DatabaseProvider, useDatabase } from './contexts/DatabaseContext';
import { BackendStatusProvider } from './contexts/BackendStatusContext';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';

export type ViewState = 'dashboard' | 'chapterList' | 'editor' | 'chapter' | 'characters' | 'assets' | 'documents' | 'settings';

export interface ActionEvent {
  type: string;
  timestamp: number;
}

// EditorView wrapper that handles chapter loading based on chapterId
const EditorViewWrapper = ({ onHeaderChange, nodes, setNodes, db, selectedChapterId, setSelectedChapterId, onNodeSelect }: { onHeaderChange?: (info: HeaderInfo) => void; nodes: SceneNode[]; setNodes: (nodes: SceneNode[]) => void; db: any; selectedChapterId: string; setSelectedChapterId: (id: string) => void; onNodeSelect?: (nodeId: string) => void }) => {
  const { chapterId } = useParams<{ chapterId: string }>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadedChapterId, setLoadedChapterId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadChapterNodes = async () => {
      if (!chapterId || loadedChapterId === chapterId) return;
      
      setIsLoading(true);
      try {
        // Load all nodes for this chapter
        const chapterNodes = await db.getNodesForChapter(chapterId);
        setNodes(chapterNodes);
        setLoadedChapterId(chapterId);
        setSelectedChapterId(chapterId);
      } catch (error) {
        console.error('Failed to load chapter nodes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChapterNodes();
  }, [chapterId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <EditorView onHeaderChange={onHeaderChange} nodes={nodes} setNodes={setNodes} chapterId={chapterId} onNodeSelect={onNodeSelect} />;
};

const AppContent = () => {
  const db = useDatabase();
  const [nodes, setNodes] = useState<SceneNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [isPlaytesting, setIsPlaytesting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<ActionEvent | null>(null);
  const [headerInfo, setHeaderInfo] = useState<HeaderInfo | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get current view from location pathname
  const getCurrentView = (): ViewState => {
    const path = location.pathname;
    if (path === '/dashboard') return 'dashboard';
    if (path === '/characters') return 'characters';
    if (path === '/assets') return 'assets';
    if (path === '/documents') return 'documents';
    if (path === '/settings') return 'settings';
    if (path === '/chapter-list') return 'chapterList';
    if (path.startsWith('/editor/')) return 'editor';
    return 'dashboard';
  };

  // 初期データロード - APIからチャプター情報を取得
  useEffect(() => {
    const loadInitialData = async () => {
      // URLにchapterIdが指定されている場合（エディター画面）はスキップ
      if (location.pathname.startsWith('/editor/')) {
        console.log('[App] Skipping initial load - already in editor view');
        return;
      }

      setIsLoading(true);
      try {
        const chapters = await db.getChapters();
        console.log('[App] Initial load - chapters:', chapters.map(ch => ({ id: ch.id, title: ch.title })));
        
        const allNodes = await Promise.all(
          chapters.map(ch => db.getNodesForChapter(ch.id))
        ).then(results => results.flat());
        console.log('[App] Initial load - allNodes loaded:', allNodes.length, 'nodes');
        
        if (allNodes.length === 0) {
          console.warn('No nodes found for the chapters');
          setIsLoading(false);
          return;
        }

        setNodes(allNodes);
        
        const lastEditedScene = allNodes.reduce((latest, current) => {
          const latestTime = new Date(latest.updatedAt || 0).getTime();
          const currentTime = new Date(current.updatedAt || 0).getTime();
          return currentTime > latestTime ? current : latest;
        });
        console.log('[App] Initial load - lastEditedScene:', { id: lastEditedScene.id, chapterId: lastEditedScene.chapterId, title: lastEditedScene.title });
        
        setSelectedNodeId(lastEditedScene.id);
        setSelectedChapterId(lastEditedScene.chapterId || '');
        
        // ヘッダー情報を初期化
        const currentChapter = chapters.find(ch => ch.id === lastEditedScene.chapterId);
        setHeaderInfo({
          title: lastEditedScene.title || 'Untitled Scene',
          chapter: currentChapter?.title || 'Unknown Chapter',
          scene: lastEditedScene.title || 'Start'
        });
      } catch (e) {
        console.error('Failed to load initial data', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [db, location.pathname]);

  // ヘッダー情報をAPIから更新（ダッシュボード・その他の画面用）
  useEffect(() => {
    const updateHeaderInfo = async () => {
      // エディター画面ではスキップ（EditorViewが直接更新する）
      if (location.pathname.startsWith('/editor/')) {
        return;
      }

      console.log('[App] updateHeaderInfo - selectedNodeId:', selectedNodeId, 'selectedChapterId:', selectedChapterId);
      if (!selectedNodeId || !selectedChapterId) return;

      try {
        // 現在のシーン情報を取得
        const currentScene = nodes.find(n => n.id === selectedNodeId);
        console.log('[App] updateHeaderInfo - currentScene found:', !!currentScene, currentScene?.title);
        if (!currentScene) return;

        // チャプター情報を取得
        const chapters = await db.getChapters();
        const currentChapter = chapters.find(ch => ch.id === selectedChapterId);
        console.log('[App] updateHeaderInfo - currentChapter found:', currentChapter?.title);

        setHeaderInfo({
          title: currentScene.title || 'Untitled Scene',
          chapter: currentChapter?.title || 'Unknown Chapter',
          scene: currentScene.title || 'Start'
        });
      } catch (e) {
        console.error('Failed to update header info', e);
      }
    };

    updateHeaderInfo();
  }, [selectedNodeId, selectedChapterId, nodes, db, location.pathname]);

  // 画面遷移用
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // chapter選択時の遷移例
  const handleChapterSelect = async (chapterName: string) => {
    navigate(`/editor/${encodeURIComponent(chapterName)}`);
  };

  // scriptエクスポート
  const exportScript = () => {
    const currentNode = nodes.find(n => n.id === selectedNodeId);
    if (!currentNode) return;
    const element = document.createElement('a');
    const file = new Blob([currentNode.script || ''], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${currentNode.title.replace(/\s+/g, '_')}_script.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // ノード管理
  const updateNodes = (newNodes: SceneNode[]) => {
    setNodes(newNodes);
  };

  // TopBarアクション
  const handleAction = (actionType: string) => {
    if (actionType === 'CONTINUE_EDITING') {
      navigate('/editor/' + selectedChapterId);
    } else if (actionType === 'PLAYTEST_SCENE') {
      setIsPlaytesting(true);
    } else if (actionType === 'EXPORT_SCRIPT') {
      exportScript();
    } else {
      setLastAction({ type: actionType, timestamp: Date.now() });
    }
  };

  // ルーティング構成
  const currentView = getCurrentView();
  
  return (
    <div className="flex h-full w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display transition-colors duration-200">
      <Sidebar currentView={''} onNavigate={handleNavigate} />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <TopBar view={currentView} headerInfo={headerInfo || { title: '', chapter: '', scene: '' }} onAction={handleAction} onNavigate={handleNavigate} />
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-background-light/50 dark:bg-background-dark/50 backdrop-blur-sm flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 scroll-smooth">
              <Dashboard onNavigate={() => navigate('/chapter-list')} />
              <div className="mt-8 flex justify-between items-center text-xs text-gray-500 dark:text-gray-600 border-t border-gray-200 dark:border-white/5 pt-4">
                <p>Eternal Echoes Engine v2.1.0</p>
                <div className="flex gap-4">
                  <a className="hover:text-gray-400 cursor-pointer">Documentation</a>
                  <a className="hover:text-gray-400 cursor-pointer">Support</a>
                </div>
              </div>
            </div>
          } />
          <Route path="/chapter-list" element={<ChapterListPage onSelectChapter={handleChapterSelect} />} />
          <Route path="/editor/:chapterId" element={<EditorViewWrapper onHeaderChange={setHeaderInfo} nodes={nodes} setNodes={updateNodes} db={db} selectedChapterId={selectedChapterId} setSelectedChapterId={setSelectedChapterId} onNodeSelect={setSelectedNodeId} />} />
          <Route path="/characters" element={<CharactersPage lastAction={lastAction} />} />
          <Route path="/assets" element={<AssetsPage lastAction={lastAction} />} />
          <Route path="/documents" element={<DocumentsPage lastAction={lastAction} />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        {/* Playtest Overlay */}
        {isPlaytesting && (
          <PlaytestOverlay nodes={nodes} startNodeId={selectedNodeId || nodes[0]?.id} onClose={() => setIsPlaytesting(false)} />
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <DatabaseProvider>
      <BackendStatusProvider>
        <AppContent />
      </BackendStatusProvider>
    </DatabaseProvider>
  );
}
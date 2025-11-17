import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { ProjectDB } from './components/ProjectDB';
import { Timeline } from './components/Timeline';
import { CharacterGraph } from './components/CharacterGraph';
import { EditorSheet } from './components/EditorSheet';
import { ViewSwitcher } from './components/ViewSwitcher';
import { EditableItem, DbItemType, Scene, Character, Location, Item, Memo, Task, Asset, DialogueEvent, ActionEvent, EventType, SceneEvent, Plot, BranchEvent, BranchMode, Variable, Group } from './types';
import { useProjectData } from './hooks/useProjectData';
import { Button } from './components/ui/Button';
import { PlusIcon } from './components/icons/PlusIcon';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsModal } from './components/SettingsModal';
import { SearchResult } from './components/SearchBar';
import { ContextMenu, ContextMenuItem } from './components/ui/ContextMenu';
import { UserGuide } from './components/UserGuide';
import { ChatBot } from './components/ChatBot';
import { InteractivePreview } from './components/InteractivePreview';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Footer } from './components/Footer';

type TabType = 'location' | 'item' | 'memo' | 'task' | 'asset' | 'plot' | 'variable' | 'group';
type SheetMode = 'view' | 'edit';
type MainView = 'timeline' | 'characterGraph' | 'aiAssistant';

const AppContent: React.FC = () => {
  const {
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
    addAsset,
  } = useProjectData();

  const { t, language } = useSettings();
  const { loading: authLoading } = useAuth();
  const [activeInfo, setActiveInfo] = useState<{ type: DbItemType | 'scene', id: string, mode: SheetMode } | null>(null);
  const [activeDbTab, setActiveDbTab] = useState<TabType>('location');
  const [mainView, setMainView] = useState<MainView>('timeline');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, items: ContextMenuItem[] } | null>(null);
  const [previewingSceneId, setPreviewingSceneId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  useEffect(() => {
    const guideCompleted = localStorage.getItem('vns-guide-completed');
    if (!guideCompleted) {
        setTimeout(() => setIsGuideOpen(true), 500);
    }
  }, []);

  const handleOpenGuide = useCallback(() => {
    setIsGuideOpen(true);
  }, []);

  const handleCloseGuide = useCallback(() => {
    setIsGuideOpen(false);
    localStorage.setItem('vns-guide-completed', 'true');
  }, []);

  const closeSheet = useCallback(() => {
    setActiveInfo(null);
  }, []);

  const handleOpenItem = useCallback((type: DbItemType | 'scene', id: string, mode: SheetMode) => {
    if (type === 'character') {
      setMainView('characterGraph');
    } else if (type === 'location' || type === 'item' || type === 'memo' || type === 'task' || type === 'asset' || type === 'plot' || type === 'variable' || type === 'group') {
      setActiveDbTab(type);
      setMainView('timeline');
    } else if (type === 'scene') {
      setMainView('timeline');
    }
    setActiveInfo({ type, id, mode });
    setFocusedNodeId(id);
  }, []);

  const handleEditItem = (type: DbItemType | 'scene', id: string) => handleOpenItem(type, id, 'edit');
  const handleViewItem = (type: DbItemType, id: string) => handleOpenItem(type, id, 'view');
  const handleViewScene = (id: string) => handleOpenItem('scene', id, 'view');


  const handleStepChange = useCallback((stepKey: string) => {
    const sidebarDependentSteps = ['sidebar', 'timeline', 'addScene', 'viewSwitcher', 'characterGraph', 'search'];
    if (sidebarDependentSteps.includes(stepKey) && !isSidebarOpen) {
      setIsSidebarOpen(true);
    }

    if (stepKey === 'characterGraph') {
      if (mainView !== 'characterGraph') setMainView('characterGraph');
    } else if (['timeline', 'addScene', 'sceneEditor'].includes(stepKey)) {
      if (mainView !== 'timeline') setMainView('timeline');
    }
    
    if (stepKey === 'sceneEditor') {
        if (!activeInfo || activeInfo.type !== 'scene') {
            const sceneToEdit = projectData?.scenes[0]?.id || addScene();
            handleEditItem('scene', sceneToEdit);
        }
    } else {
        if (activeInfo) {
            closeSheet();
        }
    }
  }, [isSidebarOpen, mainView, activeInfo, projectData, addScene, handleEditItem, closeSheet]);
  
  useEffect(() => {
    setFocusedNodeId(null);
  }, [mainView]);

  useKeyboardShortcuts({
    CLOSE_SHEET: () => {
        if (previewingSceneId) setPreviewingSceneId(null);
        else if (activeInfo) closeSheet();
        else if (isSettingsOpen) setIsSettingsOpen(false);
        else if (isGuideOpen) handleCloseGuide();
        else if (contextMenu) setContextMenu(null);
    },
    FOCUS_SEARCH: () => {
        const searchInput = document.querySelector('[data-tour-id="search-bar"] input') as HTMLInputElement;
        searchInput?.focus();
        searchInput?.select();
    },
  });

  const searchResults = useMemo((): SearchResult[] => {
    if (!searchQuery.trim() || !projectData) return [];

    const query = searchQuery.toLowerCase().trim();
    const results: SearchResult[] = [];

    const check = (text: string) => text.toLowerCase().includes(query);

    projectData.characters.forEach(c => {
        const hasPropertyMatch = c.properties?.some(p => check(p.key) || check(p.value));
        if (check(c.name) || check(c.description) || hasPropertyMatch) {
            results.push({ type: 'character', id: c.id, primary: c.name, secondary: c.description });
        }
    });
    projectData.locations.forEach(l => {
        const hasPropertyMatch = l.properties?.some(p => check(p.key) || check(p.value));
        if (check(l.name) || check(l.description) || hasPropertyMatch) {
            results.push({ type: 'location', id: l.id, primary: l.name, secondary: l.description });
        }
    });
    projectData.items.forEach(i => {
        const hasPropertyMatch = i.properties?.some(p => check(p.key) || check(p.value));
        if (check(i.name) || check(i.description) || hasPropertyMatch) {
            results.push({ type: 'item', id: i.id, primary: i.name, secondary: i.description });
        }
    });
    projectData.memos.forEach(m => {
        const hasPropertyMatch = m.properties?.some(p => check(p.key) || check(p.value));
        if (check(m.title) || check(m.content) || hasPropertyMatch) {
            results.push({ type: 'memo', id: m.id, primary: m.title, secondary: m.content });
        }
    });
    projectData.plots.forEach(p => {
        const hasPropertyMatch = p.properties?.some(p => check(p.key) || check(p.value));
        if (check(p.title) || check(p.content) || hasPropertyMatch) {
            results.push({ type: 'plot', id: p.id, primary: p.title, secondary: p.content });
        }
    });
    projectData.groups.forEach(g => {
        if (check(g.title)) {
            results.push({ type: 'group', id: g.id, primary: g.title, secondary: '' });
        }
    });
    projectData.tasks.forEach(t => {
        if (check(t.title) || check(t.description)) {
            results.push({ type: 'task', id: t.id, primary: t.title, secondary: t.description });
        }
    });
    projectData.scenes.forEach(s => {
        const eventMatch = s.events.find(e => 
            (e.type === EventType.DIALOGUE && check((e as DialogueEvent).text)) ||
            (e.type === EventType.ACTION && check((e as ActionEvent).description)) ||
            (e.type === EventType.BRANCH && (e as BranchEvent).mode === BranchMode.PLAYER_CHOICE && (e as BranchEvent).choices?.some(c => check(c.text)))
        );
        if (check(s.title) || eventMatch) {
            let secondary: string | undefined = t('titleMatch', language);
            if (eventMatch) {
              if (eventMatch.type === EventType.DIALOGUE) secondary = (eventMatch as DialogueEvent).text;
              else if (eventMatch.type === EventType.ACTION) secondary = (eventMatch as ActionEvent).description;
              else if (eventMatch.type === EventType.BRANCH) secondary = (eventMatch as BranchEvent).choices?.find(c => check(c.text))?.text;
            }
            results.push({ type: 'scene', id: s.id, primary: s.title, secondary: secondary || '' });
        }
    });

    return results;
  }, [searchQuery, projectData, t, language]);

  const activeItem: EditableItem = useMemo(() => {
    if (!activeInfo || !projectData) return null;
    const { type, id } = activeInfo;

    switch (type) {
        case 'character': {
            const data = projectData.characters.find(c => c.id === id);
            return data ? { type, data } : null;
        }
        case 'location': {
            const data = projectData.locations.find(l => l.id === id);
            return data ? { type, data } : null;
        }
        case 'item': {
            const data = projectData.items.find(i => i.id === id);
            return data ? { type, data } : null;
        }
        case 'memo': {
            const data = projectData.memos.find(m => m.id === id);
            return data ? { type, data } : null;
        }
        case 'plot': {
            const data = projectData.plots.find(p => p.id === id);
            return data ? { type, data } : null;
        }
        case 'group': {
            const data = projectData.groups.find(g => g.id === id);
            return data ? { type, data } : null;
        }
        case 'task': {
            const data = projectData.tasks.find(t => t.id === id);
            return data ? { type, data } : null;
        }
        case 'asset': {
            const data = projectData.assets.find(a => a.id === id);
            return data ? { type, data } : null;
        }
        case 'scene': {
            const data = projectData.scenes.find(s => s.id === id);
            return data ? { type, data } : null;
        }
        case 'variable': {
            const data = projectData.variables.find(v => v.id === id);
            return data ? { type, data } : null;
        }
        default:
            return null;
    }
  }, [projectData, activeInfo]);

  const handleSearchResultSelect = useCallback((type: DbItemType | 'scene', id: string) => {
    handleEditItem(type, id);
    setSearchQuery('');
  }, [handleEditItem]);

  const handleUpdateItem = useCallback((item: EditableItem) => {
    if (!item) return;
    if (item.type === 'character' || item.type === 'location' || item.type === 'item' || item.type === 'memo' || item.type === 'task' || item.type === 'asset' || item.type === 'plot' || item.type === 'variable' || item.type === 'group') {
      updateDbItem(item.type, item.data as Character | Location | Item | Memo | Task | Asset | Plot | Variable | Group);
    } else if (item.type === 'scene') {
      updateScene(item.data as Scene);
    }
  }, [updateDbItem, updateScene]);
  
  const handleTabChange = (tab: TabType) => {
    setActiveDbTab(tab);
     if(activeInfo && activeInfo.type !== 'scene' && activeInfo.type !== 'character' && activeInfo.type !== tab) {
        setActiveInfo(null);
    }
  };

  const handleAddScene = () => {
    const newId = addScene();
    setActiveInfo({ type: 'scene', id: newId, mode: 'edit' });
    setFocusedNodeId(newId);
  };
  
  const handleAddCharacter = () => {
    const newId = addDbItem('character');
    setActiveInfo({ type: 'character', id: newId, mode: 'edit' });
    setFocusedNodeId(newId);
  };
  
  const handleAddAsset = async (assetData: Omit<Asset, 'id'>) => {
    const newId = await addAsset(assetData);
    handleEditItem('asset', newId);
  };

  const handleResetData = async () => {
      if(window.confirm(t('confirmReset', language))) {
        await resetProjectData();
        setActiveInfo(null);
        setIsSettingsOpen(false);
      }
  };

  const showContextMenu = useCallback((event: React.MouseEvent, items: ContextMenuItem[]) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleDeleteWithConfirmation = useCallback((type: DbItemType, id: string) => {
    let itemToDelete: any;
    let name = t('unnamed', language);
    if (!projectData) return;
    switch(type) {
        case 'character': itemToDelete = projectData.characters.find(i => i.id === id); break;
        case 'location': itemToDelete = projectData.locations.find(i => i.id === id); break;
        case 'item': itemToDelete = projectData.items.find(i => i.id === id); break;
        case 'memo': itemToDelete = projectData.memos.find(i => i.id === id); break;
        case 'plot': itemToDelete = projectData.plots.find(i => i.id === id); break;
        case 'group': itemToDelete = projectData.groups.find(i => i.id === id); break;
        case 'task': itemToDelete = projectData.tasks.find(i => i.id === id); break;
        case 'asset': itemToDelete = projectData.assets.find(i => i.id === id); break;
        case 'variable': itemToDelete = projectData.variables.find(i => i.id === id); break;
    }
    if (itemToDelete) {
        name = itemToDelete.name || itemToDelete.title;
    }

    if (window.confirm(t('confirmDelete', language).replace('{name}', name))) {
        deleteDbItem(type, id);
        if (activeInfo?.id === id) {
            closeSheet();
        }
        if (focusedNodeId === id) {
            setFocusedNodeId(null);
        }
    }
  }, [projectData, t, language, deleteDbItem, activeInfo, closeSheet, focusedNodeId]);

  const handleDeleteSceneWithConfirmation = useCallback((id: string) => {
    const scene = projectData?.scenes.find(s => s.id === id);
    const name = scene?.title || t('untitledScene', language);
    if (window.confirm(t('confirmDelete', language).replace('{name}', name))) {
      deleteScene(id);
      if (activeInfo?.id === id) {
        closeSheet();
      }
      if (focusedNodeId === id) {
        setFocusedNodeId(null);
      }
    }
  }, [projectData?.scenes, t, language, deleteScene, activeInfo, closeSheet, focusedNodeId]);

  const handleStartPreview = useCallback((sceneId: string) => {
    setPreviewingSceneId(sceneId);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewingSceneId(null);
  }, []);

  if (authLoading || !projectData) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        {t('loading', language)}...
      </div>
    );
  }

  const renderMainView = () => {
    switch (mainView) {
      case 'characterGraph':
        return (
          <CharacterGraph 
            characters={projectData.characters}
            relationships={projectData.relationships}
            onEditCharacter={(id) => handleEditItem('character', id)}
            onViewCharacter={(id) => handleViewItem('character', id)}
            selectedCharacterId={activeInfo?.type === 'character' ? activeInfo.id : undefined}
            focusedNodeId={focusedNodeId}
            setFocusedNodeId={setFocusedNodeId}
            showContextMenu={showContextMenu}
            onAddCharacter={handleAddCharacter}
            onDeleteCharacter={(id) => handleDeleteWithConfirmation('character', id)}
          />
        );
      case 'aiAssistant':
        return <ChatBot projectData={projectData} />;
      case 'timeline':
      default:
        return (
          <Timeline
            scenes={projectData.scenes}
            groups={projectData.groups}
            variables={projectData.variables}
            onEditScene={(id) => handleEditItem('scene', id)}
            onViewScene={handleViewScene}
            onDeleteScene={handleDeleteSceneWithConfirmation}
            selectedSceneId={activeInfo?.type === 'scene' ? activeInfo.id : undefined}
            focusedNodeId={focusedNodeId}
            setFocusedNodeId={setFocusedNodeId}
            showContextMenu={showContextMenu}
            onAddScene={handleAddScene}
            onStartPreview={handleStartPreview}
          />
        );
    }
  };

  const getTitle = () => {
    switch (mainView) {
        case 'timeline': return t('timelineFlow', language);
        case 'characterGraph': return t('characterRelationshipMap', language);
        case 'aiAssistant': return t('aiAssistant', language);
        default: return '';
    }
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-background text-foreground">
      <Header 
        projectData={projectData} 
        setData={setData} 
        updateProjectName={updateProjectName}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchResults={searchResults}
        onSearchResultSelect={handleSearchResultSelect}
       />
      <main className="flex flex-1 overflow-hidden">
        {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="md:hidden fixed inset-0 bg-black/50 z-10 transition-opacity" />}
        <ProjectDB
          projectData={projectData}
          onEditItem={(type, id) => handleEditItem(type, id)}
          onViewItem={handleViewItem}
          onAddDbItem={addDbItem}
          onAddAsset={handleAddAsset}
          selectedItemId={activeInfo?.id}
          activeTab={activeDbTab}
          onTabChange={handleTabChange}
          showContextMenu={showContextMenu}
          onDeleteItem={handleDeleteWithConfirmation}
          isOpen={isSidebarOpen}
          onCloseSidebar={() => setIsSidebarOpen(false)}
        />
        <div className="flex-1 bg-background overflow-hidden flex flex-col">
            <div className="flex-1 p-4 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h1 className="text-2xl font-bold">
                       {getTitle()}
                    </h1>
                    <div className="flex items-center gap-4">
                        {mainView === 'timeline' && (
                            <Button onClick={handleAddScene} size="sm" data-tour-id="add-scene-button">
                                <PlusIcon className="w-4 h-4 mr-2" />
                                {t('addScene', language)}
                            </Button>
                        )}
                        {mainView === 'characterGraph' && (
                            <Button onClick={handleAddCharacter} size="sm" data-tour-id="add-character-button">
                                <PlusIcon className="w-4 h-4 mr-2" />
                                {t('addCharacter', language)}
                            </Button>
                        )}
                        <div data-tour-id="view-switcher" className="hidden md:block">
                           <ViewSwitcher currentView={mainView} onViewChange={setMainView} />
                        </div>
                    </div>
                </div>
                {renderMainView()}
            </div>
        </div>
      </main>
      {activeItem && (
        <EditorSheet
            item={activeItem}
            isReadOnly={activeInfo?.mode === 'view'}
            projectData={projectData}
            onUpdate={handleUpdateItem}
            onClose={closeSheet}
            onDeleteItem={deleteDbItem}
            onAddEvent={addSceneEvent}
            onAddEvents={addSceneEvents}
            onUpdateEvent={updateSceneEvent}
            onDeleteEvent={deleteSceneEvent}
            onAddRelationship={addRelationship}
            onDeleteRelationship={deleteRelationship}
            onAddScene={addScene}
        />
      )}
       {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onResetData={handleResetData}
          onOpenGuide={handleOpenGuide}
        />
      )}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={closeContextMenu}
        />
      )}
      {isGuideOpen && <UserGuide onClose={handleCloseGuide} onStepChange={handleStepChange} />}
      {previewingSceneId && (
        <InteractivePreview
            startSceneId={previewingSceneId}
            projectData={projectData}
            onClose={handleClosePreview}
        />
      )}
      <Footer currentView={mainView} onViewChange={setMainView} />
    </div>
  );
}


export default function App() {
    return (
        <SettingsProvider>
            <AppContent />
        </SettingsProvider>
    )
}
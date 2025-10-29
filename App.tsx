import React, { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { ProjectDB } from './components/ProjectDB';
import { Timeline } from './components/Timeline';
import { CharacterGraph } from './components/CharacterGraph';
import { EditorSheet } from './components/EditorSheet';
import { ViewSwitcher } from './components/ViewSwitcher';
import { EditableItem, DbItemType, Scene, Character, Location, Item, Memo, Task, Asset, DialogueEvent, ActionEvent, EventType } from './types';
import { useProjectData } from './hooks/useProjectData';
import { Button } from './components/ui/Button';
import { PlusIcon } from './components/icons/PlusIcon';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { SettingsModal } from './components/SettingsModal';
import { SearchResult } from './components/SearchBar';

type TabType = 'location' | 'item' | 'memo' | 'task' | 'asset';

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
    updateSceneEvent,
    deleteSceneEvent,
    addRelationship,
    updateRelationship,
    deleteRelationship,
    addAsset,
  } = useProjectData();

  const { t, language } = useSettings();
  const [selectedInfo, setSelectedInfo] = useState<{ type: DbItemType | 'scene', id: string } | null>(null);
  const [activeDbTab, setActiveDbTab] = useState<TabType>('location');
  const [mainView, setMainView] = useState<'timeline' | 'characterGraph'>('timeline');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo((): SearchResult[] => {
    if (!searchQuery.trim() || !projectData) return [];

    const query = searchQuery.toLowerCase().trim();
    const results: SearchResult[] = [];

    const check = (text: string) => text.toLowerCase().includes(query);

    projectData.characters.forEach(c => {
        if (check(c.name) || check(c.description)) {
            results.push({ type: 'character', id: c.id, primary: c.name, secondary: c.description });
        }
    });
    projectData.locations.forEach(l => {
        if (check(l.name) || check(l.description)) {
            results.push({ type: 'location', id: l.id, primary: l.name, secondary: l.description });
        }
    });
    projectData.items.forEach(i => {
        if (check(i.name) || check(i.description)) {
            results.push({ type: 'item', id: i.id, primary: i.name, secondary: i.description });
        }
    });
    projectData.memos.forEach(m => {
        if (check(m.title) || check(m.content)) {
            results.push({ type: 'memo', id: m.id, primary: m.title, secondary: m.content });
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
            (e.type === EventType.ACTION && check((e as ActionEvent).description))
        );
        if (check(s.title) || eventMatch) {
            const secondary = eventMatch 
                ? (eventMatch as DialogueEvent).text || (eventMatch as ActionEvent).description 
                : t('titleMatch', language);
            results.push({ type: 'scene', id: s.id, primary: s.title, secondary });
        }
    });

    return results;
  }, [searchQuery, projectData, t, language]);

  const selectedItem: EditableItem = useMemo(() => {
    if (!selectedInfo || !projectData) return null;
    const { type, id } = selectedInfo;

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
        default:
            return null;
    }
  }, [projectData, selectedInfo]);


  const handleSelectItem = useCallback((type: DbItemType | 'scene', id: string) => {
    if (type === 'character') {
      setMainView('characterGraph');
    } else if (type === 'location' || type === 'item' || type === 'memo' || type === 'task' || type === 'asset') {
      setActiveDbTab(type);
      setMainView('timeline');
    } else if (type === 'scene') {
      setMainView('timeline');
    }
    setSelectedInfo({ type: type, id });
  }, []);

  const handleSearchResultSelect = useCallback((type: DbItemType | 'scene', id: string) => {
    handleSelectItem(type, id);
    setSearchQuery('');
  }, [handleSelectItem]);

  const handleUpdateItem = useCallback((item: EditableItem) => {
    if (!item) return;
    if (item.type === 'character' || item.type === 'location' || item.type === 'item' || item.type === 'memo' || item.type === 'task' || item.type === 'asset') {
      updateDbItem(item.type, item.data as Character | Location | Item | Memo | Task | Asset);
    } else if (item.type === 'scene') {
      updateScene(item.data as Scene);
    }
  }, [updateDbItem, updateScene]);

  const handleDeselect = useCallback(() => {
    setSelectedInfo(null);
  }, []);
  
  const handleTabChange = (tab: TabType) => {
    setActiveDbTab(tab);
     if(selectedInfo && selectedInfo.type !== 'scene' && selectedInfo.type !== 'character' && selectedInfo.type !== tab) {
        setSelectedInfo(null);
    }
  };

  const handleAddScene = () => {
    const newId = addScene();
    setSelectedInfo({ type: 'scene', id: newId });
  };
  
  const handleAddCharacter = () => {
    const newId = addDbItem('character');
    setSelectedInfo({ type: 'character', id: newId });
  };
  
  const handleAddAsset = async (assetData: Omit<Asset, 'id'>) => {
    const newId = await addAsset(assetData);
    handleSelectItem('asset', newId);
  };

  const handleResetData = async () => {
      if(window.confirm(t('confirmReset', language))) {
        await resetProjectData();
        setSelectedInfo(null);
        setIsSettingsOpen(false);
      }
  };

  if (!projectData) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        Loading...
      </div>
    );
  }

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
        {isSidebarOpen && (
            <ProjectDB
              projectData={projectData}
              onSelectItem={handleSelectItem}
              onAddDbItem={addDbItem}
              onAddAsset={handleAddAsset}
              selectedItemId={selectedInfo?.id}
              activeTab={activeDbTab}
              onTabChange={handleTabChange}
            />
        )}
        <div className="flex-1 bg-background overflow-hidden flex flex-col">
            <div className="flex-1 p-4 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h1 className="text-2xl font-bold">
                        {mainView === 'timeline' ? t('timelineFlow', language) : t('characterRelationshipMap', language)}
                    </h1>
                    <div className="flex items-center gap-4">
                        {mainView === 'timeline' && (
                            <Button onClick={handleAddScene} size="sm">
                                <PlusIcon className="w-4 h-4 mr-2" />
                                {t('addScene', language)}
                            </Button>
                        )}
                        {mainView === 'characterGraph' && (
                            <Button onClick={handleAddCharacter} size="sm">
                                <PlusIcon className="w-4 h-4 mr-2" />
                                {t('addCharacter', language)}
                            </Button>
                        )}
                        <ViewSwitcher currentView={mainView} onViewChange={setMainView} />
                    </div>
                </div>
                {mainView === 'characterGraph' ? (
                  <CharacterGraph 
                    characters={projectData.characters}
                    relationships={projectData.relationships}
                    onSelectCharacter={(id) => handleSelectItem('character', id)}
                    selectedCharacterId={selectedInfo?.type === 'character' ? selectedInfo.id : undefined}
                  />
                ) : (
                  <Timeline
                    scenes={projectData.scenes}
                    onSelectScene={(id) => handleSelectItem('scene', id)}
                    onDeleteScene={deleteScene}
                    selectedSceneId={selectedInfo?.type === 'scene' ? selectedInfo.id : undefined}
                  />
                )}
            </div>
        </div>
      </main>
      {selectedItem && (
        <EditorSheet
            item={selectedItem}
            projectData={projectData}
            onUpdate={handleUpdateItem}
            onClose={handleDeselect}
            onDeleteItem={deleteDbItem}
            onAddEvent={addSceneEvent}
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
        />
      )}
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
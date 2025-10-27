import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ProjectDB } from './components/ProjectDB';
import { Timeline } from './components/Timeline';
import { CharacterGraph } from './components/CharacterGraph';
import { EditorSheet } from './components/EditorSheet';
import { ViewSwitcher } from './components/ViewSwitcher';
import { EditableItem, DbItemType } from './types';
import { useProjectData } from './hooks/useProjectData';
import { Button } from './components/ui/Button';
import { PlusIcon } from './components/icons/PlusIcon';

export default function App() {
  const {
    projectData,
    setData,
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
    deleteRelationship
  } = useProjectData();

  const [selectedItem, setSelectedItem] = useState<EditableItem>(null);
  const [activeDbTab, setActiveDbTab] = useState<DbItemType>('location');
  const [mainView, setMainView] = useState<'timeline' | 'characterGraph'>('timeline');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSelectItem = useCallback((type: DbItemType | 'scene' | 'character', id: string) => {
    let itemToEdit: EditableItem = null;
    if (type === 'character') {
      const data = projectData.characters.find(c => c.id === id);
      if (data) itemToEdit = { type: 'character', data };
      setMainView('characterGraph');
    } else if (type === 'location') {
      const data = projectData.locations.find(l => l.id === id);
      if (data) itemToEdit = { type: 'location', data };
      setActiveDbTab('location');
      setMainView('timeline');
    } else if (type === 'item') {
      const data = projectData.items.find(i => i.id === id);
      if (data) itemToEdit = { type: 'item', data };
      setActiveDbTab('item');
      setMainView('timeline');
    } else if (type === 'scene') {
      const data = projectData.scenes.find(s => s.id === id);
      if (data) itemToEdit = { type: 'scene', data };
      setMainView('timeline');
    }
    setSelectedItem(itemToEdit);
  }, [projectData]);

  const handleUpdateItem = useCallback((item: EditableItem) => {
    if (!item) return;
    if (item.type === 'character' || item.type === 'location' || item.type === 'item') {
      updateDbItem(item.type, item.data);
    } else if (item.type === 'scene') {
      updateScene(item.data);
    }
    setSelectedItem(item);
  }, [updateDbItem, updateScene]);

  const handleDeselect = useCallback(() => {
    setSelectedItem(null);
  }, []);
  
  const handleTabChange = (tab: DbItemType) => {
    setActiveDbTab(tab);
    if(selectedItem && selectedItem.type !== 'scene' && selectedItem.type !== 'character' && selectedItem.type !== tab) {
        setSelectedItem(null);
    }
  };

  const handleAddScene = () => {
    const newId = addScene();
    handleSelectItem('scene', newId);
  };
  
  const handleAddCharacter = () => {
    const newId = addDbItem('character');
    handleSelectItem('character', newId);
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-primary">
      <Header 
        projectData={projectData} 
        setData={setData} 
        updateProjectName={updateProjectName}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
       />
      <main className="flex flex-1 overflow-hidden">
        {isSidebarOpen && (
            <ProjectDB
              projectData={projectData}
              onSelectItem={handleSelectItem}
              onAddItem={addDbItem}
              selectedItemId={selectedItem?.data.id}
              activeTab={activeDbTab}
              onTabChange={handleTabChange}
            />
        )}
        <div className="flex-1 bg-primary overflow-hidden flex flex-col">
            <div className="flex-1 p-4 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h1 className="text-2xl font-bold">
                        {mainView === 'timeline' ? 'Timeline Flow' : 'Character Relationship Map'}
                    </h1>
                    <div className="flex items-center gap-4">
                        {mainView === 'timeline' && (
                            <Button onClick={handleAddScene} size="sm">
                                <PlusIcon className="w-4 h-4 mr-2" />
                                Add Scene
                            </Button>
                        )}
                        {mainView === 'characterGraph' && (
                            <Button onClick={handleAddCharacter} size="sm">
                                <PlusIcon className="w-4 h-4 mr-2" />
                                Add Character
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
                    selectedCharacterId={selectedItem?.type === 'character' ? selectedItem.data.id : undefined}
                  />
                ) : (
                  <Timeline
                    scenes={projectData.scenes}
                    onSelectScene={(id) => handleSelectItem('scene', id)}
                    onDeleteScene={deleteScene}
                    selectedSceneId={selectedItem?.type === 'scene' ? selectedItem.data.id : undefined}
                  />
                )}
            </div>
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
                />
            )}
        </div>
      </main>
    </div>
  );
}
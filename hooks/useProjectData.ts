import { useState, useCallback, useEffect } from 'react';
import { ProjectData, Character, Location, Item, Scene, SceneEvent, DbItemType, EventType, DialogueEvent, ActionEvent, BackgroundChangeEvent, ChoiceEvent, Choice, Relationship, GoToSceneEvent, Memo, Task, Asset, AssetType, Plot } from '../types';
import { getProjectDataFromDB, saveProjectDataToDB } from '../utils/db';

export const getInitialData = (): ProjectData => ({
  projectName: "New Visual Novel",
  characters: [{ id: 'char-1', name: 'Protagonist', description: 'The main character of the story.', properties: [] }],
  locations: [{ id: 'loc-1', name: 'Starting Room', description: 'A dimly lit, small room.', properties: [] }],
  items: [{ id: 'item-1', name: 'Mysterious Key', description: 'An old key with an intricate design.', properties: [] }],
  memos: [],
  tasks: [],
  plots: [],
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
});


export const useProjectData = () => {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);

  useEffect(() => {
    const loadData = async () => {
        let data = await getProjectDataFromDB();
        if (!data) {
            data = getInitialData();
            await saveProjectDataToDB(data);
        }
        setProjectData(data);
    };
    loadData();
  }, []);

  const updateAndPersistData = useCallback(async (updater: (prev: ProjectData) => ProjectData) => {
    setProjectData(prev => {
        if (!prev) return null;
        const newData = updater(prev);
        saveProjectDataToDB(newData); // Persist in the background
        return newData;
    });
  }, []);

  const setData = useCallback(async (data: ProjectData) => {
    setProjectData(data);
    await saveProjectDataToDB(data);
  }, []);

  const resetProjectData = useCallback(async () => {
    const initialData = getInitialData();
    setProjectData(initialData);
    await saveProjectDataToDB(initialData);
  }, []);

  const updateProjectName = useCallback((name: string) => {
    updateAndPersistData(prev => ({...prev, projectName: name}));
  }, [updateAndPersistData]);

  const addDbItem = useCallback((type: DbItemType) => {
    let newItem: Character | Location | Item | Memo | Task | Plot;
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
            default:
              return prev;
        }
    });
    return newItem.id;
  }, [updateAndPersistData]);

  const updateDbItem = useCallback((type: DbItemType, updatedItem: Character | Location | Item | Memo | Task | Asset | Plot) => {
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
            case 'asset':
                return {...prev, assets: prev.assets.map(a => a.id === updatedItem.id ? updatedItem as Asset : a)};
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
            case 'plot':
                return {...prev, plots: prev.plots.filter(p => p.id !== id)};
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

  const addSceneEvent = useCallback((sceneId: string, type: EventType) => {
    if(!projectData) return;
    const newEvent: Partial<SceneEvent> = { id: `event-${Date.now()}`, type };
    if (type === EventType.DIALOGUE) {
        (newEvent as DialogueEvent).characterId = projectData.characters[0]?.id || '';
        (newEvent as DialogueEvent).text = '';
    } else if (type === EventType.ACTION) {
        (newEvent as ActionEvent).description = '';
    } else if (type === EventType.BACKGROUND_CHANGE) {
        (newEvent as BackgroundChangeEvent).backgroundAssetId = projectData.assets.find(a => a.type === AssetType.BACKGROUND)?.id || '';
    } else if (type === EventType.CHOICE) {
        (newEvent as ChoiceEvent).choices = [
            { id: `choice-${Date.now()}-1`, text: 'Choice 1', nextSceneId: '' },
            { id: `choice-${Date.now()}-2`, text: 'Choice 2', nextSceneId: '' },
        ];
    } else if (type === EventType.GOTO_SCENE) {
        (newEvent as GoToSceneEvent).nextSceneId = '';
    }

    updateAndPersistData(prev => ({
        ...prev,
        scenes: prev.scenes.map(s => {
            if (s.id === sceneId) {
                return {...s, events: [...s.events, newEvent as SceneEvent]}
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
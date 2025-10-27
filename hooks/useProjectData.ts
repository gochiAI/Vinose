import { useState, useCallback } from 'react';
// FIX: Import missing event types to resolve 'Cannot find name' errors.
import { ProjectData, Character, Location, Item, Scene, SceneEvent, DbItemType, EventType, DialogueEvent, ActionEvent, BackgroundChangeEvent, ChoiceEvent, Choice, Relationship } from '../types';

const getInitialData = (): ProjectData => ({
  projectName: "New Visual Novel",
  characters: [{ id: 'char-1', name: 'Protagonist', description: 'The main character of the story.' }],
  locations: [{ id: 'loc-1', name: 'Starting Room', description: 'A dimly lit, small room.' }],
  items: [{ id: 'item-1', name: 'Mysterious Key', description: 'An old key with an intricate design.' }],
  scenes: [{ 
    id: 'scene-1', 
    title: 'Opening Scene', 
    events: [
        { id: 'event-1', type: EventType.BACKGROUND_CHANGE, locationId: 'loc-1' },
        { id: 'event-2', type: EventType.DIALOGUE, characterId: 'char-1', text: 'Where am I...?' },
        { id: 'event-3', type: EventType.ACTION, description: 'The protagonist looks around the room, trying to get their bearings.' }
    ] 
  }],
  relationships: [],
});


export const useProjectData = () => {
  const [projectData, setProjectData] = useState<ProjectData>(getInitialData());

  const setData = useCallback((data: ProjectData) => {
    setProjectData(data);
  }, []);

  const updateProjectName = useCallback((name: string) => {
    setProjectData(prev => ({...prev, projectName: name}));
  }, []);

  const addDbItem = useCallback((type: DbItemType) => {
    const newItem = {
      id: `${type.slice(0,4)}-${Date.now()}`,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      description: '',
    };
    if (type === 'character') {
      setProjectData(prev => ({...prev, characters: [...prev.characters, newItem as Character]}));
    } else if (type === 'location') {
      setProjectData(prev => ({...prev, locations: [...prev.locations, newItem as Location]}));
    } else if (type === 'item') {
      setProjectData(prev => ({...prev, items: [...prev.items, newItem as Item]}));
    }
    return newItem.id;
  }, []);

  const updateDbItem = useCallback((type: DbItemType, updatedItem: Character | Location | Item) => {
    if (type === 'character') {
      setProjectData(prev => ({...prev, characters: prev.characters.map(c => c.id === updatedItem.id ? updatedItem as Character : c)}));
    } else if (type === 'location') {
      setProjectData(prev => ({...prev, locations: prev.locations.map(l => l.id === updatedItem.id ? updatedItem as Location : l)}));
    } else if (type === 'item') {
      setProjectData(prev => ({...prev, items: prev.items.map(i => i.id === updatedItem.id ? updatedItem as Item : i)}));
    }
  }, []);

  const deleteDbItem = useCallback((type: DbItemType, id: string) => {
    if (type === 'character') {
      setProjectData(prev => ({
        ...prev,
        characters: prev.characters.filter(c => c.id !== id),
        relationships: prev.relationships.filter(r => r.sourceCharacterId !== id && r.targetCharacterId !== id)
      }));
    } else if (type === 'location') {
      setProjectData(prev => ({...prev, locations: prev.locations.filter(l => l.id !== id)}));
    } else if (type === 'item') {
      setProjectData(prev => ({...prev, items: prev.items.filter(i => i.id !== id)}));
    }
  }, []);

  const addScene = useCallback(() => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      title: 'New Scene',
      events: []
    };
    setProjectData(prev => ({...prev, scenes: [...prev.scenes, newScene]}));
    return newScene.id;
  }, []);

  const updateScene = useCallback((updatedScene: Scene) => {
    setProjectData(prev => ({...prev, scenes: prev.scenes.map(s => s.id === updatedScene.id ? updatedScene : s)}));
  }, []);
  
  const deleteScene = useCallback((id: string) => {
    setProjectData(prev => ({...prev, scenes: prev.scenes.filter(s => s.id !== id)}));
  }, []);

  const addSceneEvent = useCallback((sceneId: string, type: EventType) => {
    const newEvent: Partial<SceneEvent> = { id: `event-${Date.now()}`, type };
    if (type === EventType.DIALOGUE) {
        (newEvent as DialogueEvent).characterId = projectData.characters[0]?.id || '';
        (newEvent as DialogueEvent).text = '';
    } else if (type === EventType.ACTION) {
        (newEvent as ActionEvent).description = '';
    } else if (type === EventType.BACKGROUND_CHANGE) {
        (newEvent as BackgroundChangeEvent).locationId = projectData.locations[0]?.id || '';
    } else if (type === EventType.CHOICE) {
        (newEvent as ChoiceEvent).choices = [
            { id: `choice-${Date.now()}-1`, text: 'Choice 1', nextSceneId: '' },
            { id: `choice-${Date.now()}-2`, text: 'Choice 2', nextSceneId: '' },
        ];
    }

    setProjectData(prev => ({
        ...prev,
        scenes: prev.scenes.map(s => {
            if (s.id === sceneId) {
                return {...s, events: [...s.events, newEvent as SceneEvent]}
            }
            return s;
        })
    }));
  }, [projectData.characters, projectData.locations]);

  const updateSceneEvent = useCallback((sceneId: string, updatedEvent: SceneEvent) => {
    setProjectData(prev => ({
        ...prev,
        scenes: prev.scenes.map(s => {
            if (s.id === sceneId) {
                return {...s, events: s.events.map(e => e.id === updatedEvent.id ? updatedEvent : e)}
            }
            return s;
        })
    }));
  }, []);

  const deleteSceneEvent = useCallback((sceneId: string, eventId: string) => {
    setProjectData(prev => ({
        ...prev,
        scenes: prev.scenes.map(s => {
            if (s.id === sceneId) {
                return {...s, events: s.events.filter(e => e.id !== eventId)}
            }
            return s;
        })
    }));
  }, []);

  const addRelationship = useCallback((relationship: Omit<Relationship, 'id'>) => {
    const newRelationship: Relationship = {
      ...relationship,
      id: `rel-${Date.now()}`
    };
    setProjectData(prev => ({...prev, relationships: [...prev.relationships, newRelationship]}));
  }, []);

  const updateRelationship = useCallback((updatedRelationship: Relationship) => {
    setProjectData(prev => ({...prev, relationships: prev.relationships.map(r => r.id === updatedRelationship.id ? updatedRelationship : r)}));
  }, []);

  const deleteRelationship = useCallback((id: string) => {
    setProjectData(prev => ({...prev, relationships: prev.relationships.filter(r => r.id !== id)}));
  }, []);


  return {
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
  };
};
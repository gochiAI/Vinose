import React, { useState, useCallback, useRef, useEffect } from 'react';
import { EditableItem, ProjectData, DbItemType, SceneEvent, EventType, DialogueEvent, ActionEvent, BackgroundChangeEvent, ChoiceEvent, Choice, Relationship } from '../types';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

const MIN_HEIGHT = 150;
const MAX_HEIGHT_RATIO = 0.8;

interface EditorSheetProps {
  item: EditableItem;
  projectData: ProjectData;
  onUpdate: (item: EditableItem) => void;
  onClose: () => void;
  onDeleteItem: (type: DbItemType, id: string) => void;
  onAddEvent: (sceneId: string, type: EventType) => void;
  onUpdateEvent: (sceneId: string, event: SceneEvent) => void;
  onDeleteEvent: (sceneId: string, eventId: string) => void;
  onAddRelationship: (relationship: Omit<Relationship, 'id'>) => void;
  onDeleteRelationship: (id: string) => void;
}

const CharacterRelationshipEditor: React.FC<{
    character: { id: string, name: string, description: string };
    projectData: ProjectData;
    onAddRelationship: (relationship: Omit<Relationship, 'id'>) => void;
    onDeleteRelationship: (id: string) => void;
}> = ({ character, projectData, onAddRelationship, onDeleteRelationship }) => {
    const [targetId, setTargetId] = useState('');
    const [relType, setRelType] = useState('');

    const handleAdd = () => {
        if (!targetId || !relType.trim()) return;
        onAddRelationship({
            sourceCharacterId: character.id,
            targetCharacterId: targetId,
            type: relType.trim(),
        });
        setTargetId('');
        setRelType('');
    };

    const characterRelationships = projectData.relationships.filter(
        r => r.sourceCharacterId === character.id || r.targetCharacterId === character.id
    );

    return (
        <div className="space-y-3">
            <h4 className="text-md font-semibold mt-2 text-text-secondary">Relationships</h4>
            <div className="p-2 bg-primary border border-tertiary rounded-md space-y-2">
                <select
                    value={targetId}
                    onChange={e => setTargetId(e.target.value)}
                    className="w-full bg-primary border border-tertiary rounded-md px-2 py-1 text-sm text-text-primary focus:ring-accent focus:border-accent"
                >
                    <option value="">Select Character...</option>
                    {projectData.characters
                        .filter(c => c.id !== character.id)
                        .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Input
                    placeholder="Relationship type (e.g., Friend)"
                    value={relType}
                    onChange={e => setRelType(e.target.value)}
                />
                <Button variant="secondary" size="sm" onClick={handleAdd} className="w-full">
                    <PlusIcon className="w-4 h-4 mr-1" /> Add Relationship
                </Button>
            </div>
            <div className="space-y-1">
                {characterRelationships.map(rel => {
                    const otherCharId = rel.sourceCharacterId === character.id ? rel.targetCharacterId : rel.sourceCharacterId;
                    const otherChar = projectData.characters.find(c => c.id === otherCharId);
                    const isSource = rel.sourceCharacterId === character.id;
                    if (!otherChar) return null;

                    return (
                        <div key={rel.id} className="flex items-center justify-between text-sm bg-primary p-2 rounded-md">
                            <div>
                                <span className="font-bold">{isSource ? '→' : '←'} {otherChar.name}</span>
                                <span className="text-text-secondary ml-2">({rel.type})</span>
                            </div>
                            <button onClick={() => onDeleteRelationship(rel.id)} className="text-text-secondary hover:text-red-500 p-1">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const DbItemEditor: React.FC<{
    item: { type: 'character' | 'location' | 'item', data: { id: string, name: string, description: string } };
    projectData: ProjectData;
    onUpdate: (item: EditableItem) => void;
    onDeleteItem: (type: DbItemType, id: string) => void;
    onClose: () => void;
    onAddRelationship: (relationship: Omit<Relationship, 'id'>) => void;
    onDeleteRelationship: (id: string) => void;
}> = ({ item, projectData, onUpdate, onDeleteItem, onClose, onAddRelationship, onDeleteRelationship }) => {
    
    const handleDelete = () => {
        if(window.confirm(`Are you sure you want to delete "${item.data.name}"? This action cannot be undone.`)){
            onDeleteItem(item.type, item.data.id);
            onClose();
        }
    };
    
    return (
        <div className="flex h-full p-4 space-x-4">
            <div className="flex-1 space-y-4">
                <Input
                    label="Name"
                    value={item.data.name}
                    onChange={(e) => onUpdate({ ...item, data: { ...item.data, name: e.target.value } })}
                />
                <Textarea
                    label="Description"
                    value={item.data.description}
                    rows={5}
                    onChange={(e) => onUpdate({ ...item, data: { ...item.data, description: e.target.value } })}
                />
                 <div className="pt-4">
                     <Button variant="danger" onClick={handleDelete} className="w-full">
                        Delete {item.type}
                     </Button>
                </div>
            </div>

            {item.type === 'character' && (
                <div className="flex-1 overflow-y-auto border-l border-border-color pl-4">
                    <CharacterRelationshipEditor 
                        character={item.data}
                        projectData={projectData}
                        onAddRelationship={onAddRelationship}
                        onDeleteRelationship={onDeleteRelationship}
                    />
                </div>
            )}
        </div>
    );
}

const SceneEditor: React.FC<{
    item: { type: 'scene', data: any };
    projectData: ProjectData;
    onUpdate: (item: EditableItem) => void;
    onAddEvent: (sceneId: string, type: EventType) => void;
    onUpdateEvent: (sceneId: string, event: SceneEvent) => void;
    onDeleteEvent: (sceneId: string, eventId: string) => void;
}> = ({ item, projectData, onUpdate, onAddEvent, onUpdateEvent, onDeleteEvent }) => {
    const scene = item.data;

    const handleEventChange = (event: SceneEvent) => {
        onUpdateEvent(scene.id, event);
    }
    
    const renderEventEditor = (event: SceneEvent) => {
        switch (event.type) {
            case EventType.DIALOGUE:
                return (
                    <div className="flex gap-2">
                        <select
                            value={(event as DialogueEvent).characterId}
                            onChange={(e) => handleEventChange({ ...event, characterId: e.target.value })}
                            className="flex-shrink-0 bg-primary border border-tertiary rounded-md px-2 py-1 text-sm text-text-primary focus:ring-accent focus:border-accent"
                        >
                             {!projectData.characters.some(c => c.id === (event as DialogueEvent).characterId) && (
                                <option value={(event as DialogueEvent).characterId} disabled>
                                    Missing Character
                                </option>
                            )}
                            {projectData.characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <Textarea
                            placeholder="Dialogue text..."
                            value={(event as DialogueEvent).text}
                            rows={2}
                            onChange={(e) => handleEventChange({ ...event, text: e.target.value })}
                        />
                    </div>
                );
            case EventType.ACTION:
                return <Textarea placeholder="Action description..." value={(event as ActionEvent).description} rows={2} onChange={(e) => handleEventChange({ ...event, description: e.target.value })} />;
            case EventType.BACKGROUND_CHANGE:
                 return (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-text-secondary">Set background to:</span>
                        <select
                            value={(event as BackgroundChangeEvent).locationId}
                            onChange={(e) => handleEventChange({ ...event, locationId: e.target.value })}
                            className="bg-primary border border-tertiary rounded-md px-2 py-1 text-sm text-text-primary focus:ring-accent focus:border-accent"
                        >
                            {!projectData.locations.some(l => l.id === (event as BackgroundChangeEvent).locationId) && (
                                <option value={(event as BackgroundChangeEvent).locationId} disabled>
                                    Missing Location
                                </option>
                            )}
                            {projectData.locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>
                 );
            case EventType.CHOICE: {
                const choiceEvent = event as ChoiceEvent;
                const handleUpdateChoice = (choiceIndex: number, updatedChoice: Partial<Choice>) => {
                    const newChoices = [...choiceEvent.choices];
                    newChoices[choiceIndex] = { ...newChoices[choiceIndex], ...updatedChoice };
                    handleEventChange({ ...choiceEvent, choices: newChoices });
                };

                const handleAddChoice = () => {
                    const newChoice: Choice = {
                        id: `choice-${Date.now()}`,
                        text: 'New Choice',
                        nextSceneId: '',
                    };
                    handleEventChange({ ...choiceEvent, choices: [...choiceEvent.choices, newChoice] });
                };

                const handleDeleteChoice = (choiceIndex: number) => {
                    const newChoices = choiceEvent.choices.filter((_, i) => i !== choiceIndex);
                    handleEventChange({ ...choiceEvent, choices: newChoices });
                };

                return (
                    <div className="space-y-3">
                        {choiceEvent.choices.map((choice, index) => (
                            <div key={choice.id} className="p-2 bg-primary border border-tertiary rounded-md space-y-2">
                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder="Choice text..."
                                        value={choice.text}
                                        onChange={(e) => handleUpdateChoice(index, { text: e.target.value })}
                                        className="flex-grow"
                                    />
                                    <button onClick={() => handleDeleteChoice(index)} className="text-text-secondary hover:text-red-500 p-1">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-text-secondary flex-shrink-0">→ Go to:</span>
                                    <select
                                        value={choice.nextSceneId}
                                        onChange={(e) => handleUpdateChoice(index, { nextSceneId: e.target.value })}
                                        className="w-full bg-primary border border-tertiary rounded-md px-2 py-1 text-sm text-text-primary focus:ring-accent focus:border-accent"
                                    >
                                        <option value="">(Nowhere)</option>
                                        {projectData.scenes.map(s => (
                                            <option key={s.id} value={s.id}>{s.title || 'Untitled Scene'}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                        <Button variant="secondary" size="sm" onClick={handleAddChoice} className="w-full">
                            <PlusIcon className="w-4 h-4 mr-1" />
                            Add Choice
                        </Button>
                    </div>
                );
            }
            default:
                return null;
        }
    }

    return (
        <div className="flex h-full p-4 space-x-4">
            <div className="flex-1 space-y-4">
                 <Input
                    label="Scene Title"
                    value={scene.title}
                    onChange={(e) => onUpdate({ ...item, data: { ...scene, title: e.target.value } })}
                />
                 <div className="pt-4 border-t border-border-color">
                    <p className="text-sm font-medium text-text-secondary mb-2">Add New Event:</p>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="secondary" size="sm" onClick={() => onAddEvent(scene.id, EventType.DIALOGUE)}>Dialogue</Button>
                        <Button variant="secondary" size="sm" onClick={() => onAddEvent(scene.id, EventType.ACTION)}>Action</Button>
                        <Button variant="secondary" size="sm" onClick={() => onAddEvent(scene.id, EventType.BACKGROUND_CHANGE)}>BG Change</Button>
                        <Button variant="secondary" size="sm" onClick={() => onAddEvent(scene.id, EventType.CHOICE)}>Choice</Button>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto border-l border-border-color pl-4">
                 <h4 className="text-md font-semibold mb-2 text-text-secondary">Events</h4>
                <div className="space-y-3">
                    {scene.events.map((event: SceneEvent) => (
                        <div key={event.id} className="bg-primary p-3 rounded-md border border-tertiary">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold uppercase text-text-secondary">{event.type}</span>
                                <button onClick={() => onDeleteEvent(scene.id, event.id)} className="text-text-secondary hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                            {renderEventEditor(event)}
                        </div>
                    ))}
                    {scene.events.length === 0 && (
                        <div className="text-center py-6 text-sm text-text-secondary">
                            No events in this scene.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const EditorSheet: React.FC<EditorSheetProps> = ({ item, ...props }) => {
    const [height, setHeight] = useState(300);
    const isResizing = useRef(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.body.style.cursor = 'row-resize';
    };

    const handleMouseUp = useCallback(() => {
        isResizing.current = false;
        document.body.style.cursor = 'default';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing.current) return;
        const newHeight = window.innerHeight - e.clientY;
        const maxHeight = window.innerHeight * MAX_HEIGHT_RATIO;
        const clampedHeight = Math.max(MIN_HEIGHT, Math.min(newHeight, maxHeight));
        setHeight(clampedHeight);
    }, []);

    useEffect(() => {
        if (isResizing.current) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);
    
    if (!item) return null;

    const itemTypeTitle = item.type.charAt(0).toUpperCase() + item.type.slice(1);

    return (
        <div className="bg-secondary border-t border-border-color flex flex-col flex-shrink-0" style={{ height: `${height}px` }}>
            <div 
                onMouseDown={handleMouseDown}
                className="w-full h-2 cursor-row-resize flex items-center justify-center group"
            >
                <div className="w-10 h-1 bg-border-color rounded-full group-hover:bg-accent transition-colors" />
            </div>

            <div className="flex justify-between items-center px-4 pb-2 flex-shrink-0">
                {/* FIX: Use a ternary operator to correctly access 'title' for scenes and 'name' for other item types, resolving the TypeScript error. */}
                <h2 className="text-xl font-bold">Edit {itemTypeTitle}: <span className="text-accent">{item.type === 'scene' ? (item.data.title || 'Untitled Scene') : (item.data.name || `Unnamed ${item.type}`)}</span></h2>
                <button onClick={props.onClose} className="p-1 rounded-full hover:bg-tertiary text-text-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div className="flex-1 overflow-auto">
                {(item.type === 'character' || item.type === 'location' || item.type === 'item') ? (
                    <DbItemEditor 
                        item={item} 
                        {...props}
                    />
                ) : (
                    <SceneEditor item={item} {...props} />
                )}
            </div>
        </div>
    );
};
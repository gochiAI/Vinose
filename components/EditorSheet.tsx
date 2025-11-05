import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { EditableItem, ProjectData, DbItemType, SceneEvent, EventType, DialogueEvent, ActionEvent, BackgroundChangeEvent, ChoiceEvent, Choice, Relationship, Scene, GoToSceneEvent, Memo, Task, Character, Location, Item, Asset, AssetType, Plot, CustomProperty, SfxEvent } from '../types';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { useSettings } from '../contexts/SettingsContext';
import { Checkbox } from './ui/Checkbox';
import { SparklesIcon } from './icons/SparklesIcon';
import { AiAssistantModal } from './AiAssistantModal';
import { DialogueIcon } from './icons/DialogueIcon';
import { ActionIcon } from './icons/ActionIcon';
import { ImageIcon } from './icons/ImageIcon';
import { ChoiceIcon } from './icons/ChoiceIcon';
import { GotoSceneIcon } from './icons/GotoSceneIcon';
import { CharacterIcon } from './icons/CharacterIcon';
import { SfxIcon } from './icons/SfxIcon';

declare const marked: any;
declare const DOMPurify: any;

// Placed hook here to avoid creating new files
export const useGemini = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isAvailable = !!process.env.API_KEY;

    const generateContent = async (prompt: string): Promise<string | null> => {
        if (!process.env.API_KEY) {
            setError("API key is not configured. Please set it up in the settings.");
            console.error("API_KEY environment variable not set.");
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            return response.text;
        } catch (e: any) {
            console.error("Error generating content:", e);
            setError(e.message || "An unknown error occurred.");
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        generateContent,
        isLoading,
        error,
        isAvailable
    };
};

const CustomPropertiesEditor: React.FC<{
    properties: CustomProperty[];
    onUpdateProperties: (newProperties: CustomProperty[]) => void;
}> = ({ properties, onUpdateProperties }) => {
    const { t, language } = useSettings();

    const handleAddProperty = () => {
        const newProperties = [...properties, { id: `prop-${Date.now()}`, key: '', value: '' }];
        onUpdateProperties(newProperties);
    };

    const handlePropertyChange = (id: string, field: 'key' | 'value', newValue: string) => {
        const newProperties = properties.map(p => p.id === id ? { ...p, [field]: newValue } : p);
        onUpdateProperties(newProperties);
    };

    const handleDeleteProperty = (id: string) => {
        const newProperties = properties.filter(p => p.id !== id);
        onUpdateProperties(newProperties);
    };
    
    return (
        <div className="space-y-3">
            <h4 className="text-md font-semibold text-muted-foreground">{t('customProperties', language)}</h4>
            <div className="p-2 bg-background border border-border rounded-md space-y-2">
                {properties.map(prop => (
                    <div key={prop.id} className="flex items-center gap-2">
                        <Input 
                            placeholder={t('key', language)}
                            value={prop.key}
                            onChange={(e) => handlePropertyChange(prop.id, 'key', e.target.value)}
                            className="flex-1"
                        />
                        <Input 
                            placeholder={t('value', language)}
                            value={prop.value}
                            onChange={(e) => handlePropertyChange(prop.id, 'value', e.target.value)}
                            className="flex-1"
                        />
                         <button onClick={() => handleDeleteProperty(prop.id)} className="text-muted-foreground hover:text-danger p-1" title={t('delete', language)}>
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <Button variant="secondary" size="sm" onClick={handleAddProperty} className="w-full">
                    <PlusIcon className="w-4 h-4 mr-1" /> {t('addProperty', language)}
                </Button>
            </div>
        </div>
    );
};

const CustomPropertiesViewer: React.FC<{
    properties?: CustomProperty[];
}> = ({ properties }) => {
    const { t, language } = useSettings();
    
    if (!properties || properties.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground pt-2">{t('customProperties', language)}</h4>
            <dl className="text-sm bg-background p-3 rounded-md border border-border">
                {properties.map(prop => (
                    <div key={prop.id} className="flex justify-between py-1">
                        <dt className="font-medium text-foreground">{prop.key || `(${t('unnamed', language)})`}:</dt>
                        <dd className="text-muted-foreground text-right">{prop.value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
};

interface EditorSheetProps {
  item: EditableItem;
  isReadOnly?: boolean;
  projectData: ProjectData;
  onUpdate: (item: EditableItem) => void;
  onClose: () => void;
  onDeleteItem: (type: DbItemType, id: string) => void;
  onAddEvent: (sceneId: string, type: EventType, index?: number) => void;
  onAddEvents: (sceneId: string, events: SceneEvent[]) => void;
  onUpdateEvent: (sceneId: string, event: SceneEvent) => void;
  onDeleteEvent: (sceneId: string, eventId: string) => void;
  onAddRelationship: (relationship: Omit<Relationship, 'id'>) => void;
  onDeleteRelationship: (id: string) => void;
  onAddScene: () => string;
}

const CharacterRelationshipEditor: React.FC<{
    character: { id: string, name: string, description: string };
    projectData: ProjectData;
    isReadOnly?: boolean;
    onAddRelationship: (relationship: Omit<Relationship, 'id'>) => void;
    onDeleteRelationship: (id: string) => void;
}> = ({ character, projectData, isReadOnly, onAddRelationship, onDeleteRelationship }) => {
    const { t, language } = useSettings();
    const [targetId, setTargetId] = React.useState('');
    const [relType, setRelType] = React.useState('');

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
            <h4 className="text-md font-semibold mt-2 text-muted-foreground">{t('relationships', language)}</h4>
            {!isReadOnly && (
                <div className="p-2 bg-background border border-border rounded-md space-y-2">
                    <select
                        value={targetId}
                        onChange={e => setTargetId(e.target.value)}
                        className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground focus:ring-ring focus:border-ring outline-none"
                    >
                        <option value="">{t('selectCharacter', language)}...</option>
                        {projectData.characters
                            .filter(c => c.id !== character.id)
                            .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <Input
                        placeholder={t('relationshipTypePlaceholder', language)}
                        value={relType}
                        onChange={e => setRelType(e.target.value)}
                    />
                    <Button variant="secondary" size="sm" onClick={handleAdd} className="w-full">
                        <PlusIcon className="w-4 h-4 mr-1" /> {t('addRelationship', language)}
                    </Button>
                </div>
            )}
            <div className="space-y-1">
                {characterRelationships.map(rel => {
                    const otherCharId = rel.sourceCharacterId === character.id ? rel.targetCharacterId : rel.sourceCharacterId;
                    const otherChar = projectData.characters.find(c => c.id === otherCharId);
                    const isSource = rel.sourceCharacterId === character.id;
                    if (!otherChar) return null;

                    return (
                        <div key={rel.id} className="flex items-center justify-between text-sm bg-background p-2 rounded-md">
                            <div>
                                <span className="font-bold">{isSource ? '→' : '←'} {otherChar.name}</span>
                                <span className="text-muted-foreground ml-2">({rel.type})</span>
                            </div>
                            {!isReadOnly && (
                                <button onClick={() => onDeleteRelationship(rel.id)} className="text-muted-foreground hover:text-danger p-1" title={t('deleteRelationship', language)}>
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// FIX: Changed the 'item' prop to be a discriminated union for proper type narrowing.
const DbItemEditor: React.FC<{
    item:
      | { type: 'character'; data: Character }
      | { type: 'location'; data: Location }
      | { type: 'item'; data: Item }
      | { type: 'memo'; data: Memo }
      | { type: 'task'; data: Task }
      | { type: 'plot'; data: Plot };
    projectData: ProjectData;
    onUpdate: (item: EditableItem) => void;
    onDeleteItem: (type: DbItemType, id: string) => void;
    onClose: () => void;
    onAddRelationship: (relationship: Omit<Relationship, 'id'>) => void;
    onDeleteRelationship: (id: string) => void;
}> = ({ item, projectData, onUpdate, onDeleteItem, onClose, onAddRelationship, onDeleteRelationship }) => {
    const { t, language } = useSettings();
    const [editMode, setEditMode] = React.useState<'write' | 'preview'>('write');
    const { generateContent, isLoading, isAvailable } = useGemini();
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiResult, setAiResult] = useState('');

    // FIX: Use discriminated union `item.type` for type-safe property access.
    const hasTitle = item.type === 'memo' || item.type === 'task' || item.type === 'plot';
    const title = hasTitle ? item.data.title : item.data.name;

    const handleDelete = () => {
        if(window.confirm(t('confirmDelete', language).replace('{name}', title))){
            onDeleteItem(item.type, item.data.id);
            onClose();
        }
    };
    
    // FIX: Use discriminated union `item.type` for type-safe property access.
    const hasContent = item.type === 'memo' || item.type === 'plot';
    const content = hasContent ? item.data.content : item.data.description;
    const label = hasContent ? t('content', language) : t('description', language);

    // FIX: Use discriminated union `item.type` for type-safe updates.
    const handleContentChange = (value: string) => {
        if (item.type === 'memo' || item.type === 'plot') {
            onUpdate({ ...item, data: { ...item.data, content: value } });
        } else { // 'character', 'location', 'item', 'task'
            onUpdate({ ...item, data: { ...item.data, description: value } });
        }
    };
    
    const handleGenerateDescription = async () => {
        setAiResult('');
        if (item.type !== 'character') return;
        const char = item.data;
        const systemPrompt = `You are a creative assistant for a visual novel writer.
Based on the character's name, current description, and the user's request, generate a new, richer description for the character.
Output only the description text itself, without any introductory phrases.

Character Name: ${char.name}
Current Description: ${content}

User Request: ${aiPrompt}
`;
        const result = await generateContent(systemPrompt);
        if (result) {
            setAiResult(result);
        }
    };

    const handleInsertDescription = (text: string) => {
        handleContentChange(content ? `${content}\n\n${text}` : text);
        setIsAiOpen(false);
        setAiResult('');
        setAiPrompt('');
    };

    return (
        <div className="flex h-full p-4 space-x-4">
            <div className="flex-1 space-y-4">
                <Input
                    label={hasTitle ? t('title', language) : t('name', language)}
                    value={title}
                    // FIX: Use discriminated union `item.type` for type-safe updates.
                    onChange={(e) => {
                        const newValue = e.target.value;
                        if (item.type === 'memo' || item.type === 'plot' || item.type === 'task') {
                            onUpdate({ ...item, data: { ...item.data, title: newValue } });
                        } else {
                            onUpdate({ ...item, data: { ...item.data, name: newValue } });
                        }
                    }}
                />
                
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                             <label className="block text-sm font-medium text-muted-foreground">{label}</label>
                              {item.type === 'character' && (
                                <button
                                    onClick={() => setIsAiOpen(true)}
                                    className="text-primary hover:text-primary-hover"
                                    title={t('aiAssistant', language)}
                                >
                                    <SparklesIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex bg-secondary p-0.5 rounded-md text-xs">
                            <button
                                onClick={() => setEditMode('write')}
                                className={`px-2 py-0.5 rounded-sm transition-colors ${editMode === 'write' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary-hover'}`}
                            >
                                {t('write', language)}
                            </button>
                            <button
                                onClick={() => setEditMode('preview')}
                                className={`px-2 py-0.5 rounded-sm transition-colors ${editMode === 'preview' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary-hover'}`}
                            >
                                {t('preview', language)}
                            </button>
                        </div>
                    </div>
                    {editMode === 'write' ? (
                        <Textarea
                            value={content}
                            rows={5}
                            onChange={(e) => handleContentChange(e.target.value)}
                        />
                    ) : (
                        <div
                            className="prose prose-sm max-w-none w-full min-h-[128px] bg-background border border-border rounded-md px-3 py-2 text-foreground overflow-y-auto"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(content || `*${t('noContentPreview', language)}*`)) }}
                        />
                    )}
                </div>
               
                {/* FIX: Use discriminated union `item.type` for type-safe access and updates. */}
                {item.type === 'task' && (
                    <div className="pt-2">
                        <Checkbox
                            id="task-completed"
                            label={t('completed', language)}
                            checked={item.data.completed}
                            onChange={(e) => onUpdate({ ...item, data: { ...item.data, completed: e.target.checked }})}
                        />
                    </div>
                )}
                 <div className="pt-4">
                     <Button variant="danger" onClick={handleDelete} className="w-full">
                        {t('delete', language)} {t(item.type, language)}
                     </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto border-l border-border pl-4 space-y-4">
                {item.type === 'character' && (
                    <CharacterRelationshipEditor 
                        character={item.data}
                        projectData={projectData}
                        onAddRelationship={onAddRelationship}
                        onDeleteRelationship={onDeleteRelationship}
                    />
                )}
                {/* FIX: Use discriminated union `item.type` for type-safe property access and updates. */}
                {item.type !== 'task' && (
                    <CustomPropertiesEditor 
                        properties={item.data.properties || []}
                        onUpdateProperties={(newProps) => {
                            onUpdate({ ...item, data: { ...item.data, properties: newProps } });
                        }}
                    />
                )}
            </div>
             <AiAssistantModal
                isOpen={isAiOpen}
                onClose={() => setIsAiOpen(false)}
                title={t('aiCharacterGeneration', language)}
                prompt={aiPrompt}
                onPromptChange={setAiPrompt}
                onSubmit={handleGenerateDescription}
                isLoading={isLoading}
                isAvailable={isAvailable}
                result={aiResult}
                onInsert={handleInsertDescription}
                insertButtonText={t('append', language)}
                aiPromptPlaceholder={t('aiPromptPlaceholder', language)}
            />
        </div>
    );
}

// FIX: Changed the 'item' prop to be a discriminated union for proper type narrowing.
const DbItemViewer: React.FC<{
    item:
      | { type: 'character'; data: Character }
      | { type: 'location'; data: Location }
      | { type: 'item'; data: Item }
      | { type: 'memo'; data: Memo }
      | { type: 'task'; data: Task }
      | { type: 'plot'; data: Plot };
    projectData: ProjectData;
}> = ({ item, projectData }) => {
    const { t, language } = useSettings();

    // FIX: Use discriminated union `item.type` for type-safe property access.
    const hasTitle = item.type === 'memo' || item.type === 'task' || item.type === 'plot';
    const title = hasTitle ? item.data.title : item.data.name;
    const hasContent = item.type === 'memo' || item.type === 'plot';
    const content = hasContent ? item.data.content : item.data.description;
    const label = hasContent ? t('content', language) : t('description', language);

    return (
        <div className="flex h-full p-6 space-x-6">
            <div className="flex-1 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">{hasTitle ? t('title', language) : t('name', language)}</h3>
                <p className="text-2xl font-bold text-foreground -mt-2">{title}</p>
                
                {item.type === 'task' && (
                    <p className="text-sm">
                        <span className="font-semibold text-muted-foreground">{t('status', language)}: </span>
                        {item.data.completed ? t('completedStatus', language) : t('incomplete', language)}
                    </p>
                )}

                <h3 className="text-sm font-semibold text-muted-foreground pt-2">{label}</h3>
                <div
                    className="prose prose-sm max-w-none w-full text-foreground -mt-2"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(content || `*${t('noContentPreview', language)}*`)) }}
                />
                 {/* FIX: Use discriminated union `item.type` for type-safe property access. */}
                 {item.type !== 'task' && <CustomPropertiesViewer properties={item.data.properties} />}
            </div>

            {item.type === 'character' && (
                <div className="w-1/3 overflow-y-auto border-l border-border pl-6">
                    <CharacterRelationshipEditor 
                        character={item.data}
                        projectData={projectData}
                        isReadOnly={true}
                        onAddRelationship={() => {}}
                        onDeleteRelationship={() => {}}
                    />
                </div>
            )}
        </div>
    );
};


const AssetEditor: React.FC<{
    item: { type: 'asset', data: Asset };
    onUpdate: (item: EditableItem) => void;
    onDeleteItem: (type: DbItemType, id: string) => void;
    onClose: () => void;
}> = ({ item, onUpdate, onDeleteItem, onClose }) => {
    const { t, language } = useSettings();
    const asset = item.data;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDelete = () => {
        if(window.confirm(t('confirmDelete', language).replace('{name}', asset.name))){
            onDeleteItem(item.type, asset.id);
            onClose();
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            onUpdate({ 
                ...item, 
                data: { 
                    ...asset, 
                    data: dataUrl, 
                    mimeType: file.type,
                } 
            });
        };
        reader.readAsDataURL(file);
        event.target.value = ''; // Reset file input
    };

    return (
        <div className="p-4 space-y-4">
            <Input
                label={t('assetName', language)}
                value={asset.name}
                onChange={(e) => onUpdate({ ...item, data: { ...asset, name: e.target.value } })}
            />
            <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">{t('assetType', language)}</label>
                 <select
                    value={asset.type}
                    onChange={(e) => onUpdate({ ...item, data: { ...asset, type: e.target.value as AssetType } })}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                 >
                    {Object.values(AssetType).map(type => (
                        <option key={type} value={type}>{t(type.toLowerCase() as any, language)}</option>
                    ))}
                 </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">{t('assetPreview', language)}</label>
                <div className="w-full p-2 bg-background border border-border rounded-md min-h-[100px] flex items-center justify-center">
                    {asset.data ? (
                      asset.mimeType.startsWith('image/') ? (
                          <img src={asset.data} alt={asset.name} className="max-w-full max-h-64 object-contain" />
                      ) : asset.mimeType.startsWith('audio/') ? (
                          <audio controls src={asset.data} />
                      ) : (
                          <p className="text-sm text-muted-foreground">{t('noPreview', language)}</p>
                      )
                    ) : (
                        <div className="text-center p-4">
                            <p className="text-sm text-muted-foreground">{t('noFileUploaded', language)}</p>
                            <Button variant="secondary" size="sm" className="mt-2" onClick={handleUploadClick}>
                                {t('uploadFile', language)}...
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept={asset.type === AssetType.SFX ? 'audio/*' : 'image/*'}
                            />
                        </div>
                    )}
                </div>
            </div>
            <div className="pt-4">
                 <Button variant="danger" onClick={handleDelete} className="w-full">
                    {t('delete', language)} {t(item.type, language)}
                 </Button>
            </div>
        </div>
    );
};

const AssetViewer: React.FC<{
    item: { type: 'asset', data: Asset };
}> = ({ item }) => {
    const { t, language } = useSettings();
    const asset = item.data;

    return (
        <div className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">{t('assetName', language)}</h3>
            <p className="text-2xl font-bold text-foreground -mt-2">{asset.name}</p>

            <h3 className="text-sm font-semibold text-muted-foreground">{t('assetType', language)}</h3>
            <p className="text-foreground -mt-2">{t(asset.type.toLowerCase() as any, language)}</p>

            <h3 className="text-sm font-semibold text-muted-foreground">{t('assetPreview', language)}</h3>
            <div className="w-full p-2 bg-background border border-border rounded-md min-h-[100px] flex items-center justify-center">
                {asset.data ? (
                    asset.mimeType.startsWith('image/') ? (
                        <img src={asset.data} alt={asset.name} className="max-w-full max-h-64 object-contain" />
                    ) : asset.mimeType.startsWith('audio/') ? (
                        <audio controls src={asset.data} className="w-full" />
                    ) : (
                        <p className="text-sm text-muted-foreground">{t('noPreview', language)}</p>
                    )
                ) : (
                    <p className="text-sm text-muted-foreground">{t('noFileUploaded', language)}</p>
                )}
            </div>
        </div>
    );
};


const AssetSelector: React.FC<{
    assetType: AssetType;
    label: string;
    selectedValue: string | undefined;
    onValueChange: (newValue: string) => void;
    projectData: ProjectData;
    disabled?: boolean;
}> = ({ assetType, label, selectedValue, onValueChange, projectData, disabled }) => {
    const { t, language } = useSettings();
    const filteredAssets = projectData.assets.filter(a => a.type === assetType);
    return (
        <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
            <select
                value={selectedValue || ''}
                disabled={disabled}
                onChange={(e) => onValueChange(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground focus:ring-ring focus:border-ring outline-none disabled:opacity-70 disabled:cursor-not-allowed"
            >
                <option value="">({t('none', language)})</option>
                {filteredAssets.length === 0 && <option disabled>{t('noAssetsOfType', language)}</option>}
                {filteredAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
            </select>
        </div>
    );
}

const AddEventControl: React.FC<{
    index: number;
    sceneId: string;
    onAddEvent: (sceneId: string, type: EventType, index?: number) => void;
}> = ({ index, sceneId, onAddEvent }) => {
    const [isAdding, setIsAdding] = useState(false);
    const { t, language } = useSettings();

    const handleAdd = (type: EventType) => {
        onAddEvent(sceneId, type, index);
        setIsAdding(false);
    };

    if (isAdding) {
        return (
            <div className="p-2 bg-secondary rounded-md my-2 animate-fade-in-fast">
                <div className="grid grid-cols-3 gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleAdd(EventType.DIALOGUE)}>{t('dialogue', language)}</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleAdd(EventType.ACTION)}>{t('action', language)}</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleAdd(EventType.BACKGROUND_CHANGE)}>{t('bgChange', language)}</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleAdd(EventType.CHOICE)}>{t('choice', language)}</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleAdd(EventType.GOTO_SCENE)}>{t('goToScene', language)}</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleAdd(EventType.SFX)}>{t('sfx', language)}</Button>
                </div>
                <button onClick={() => setIsAdding(false)} className="text-xs text-muted-foreground hover:text-foreground mt-2 w-full">{t('cancel', language)}</button>
            </div>
        );
    }

    return (
        <div className="relative h-3 group my-1 flex items-center">
            <hr className="w-full border-t border-border group-hover:border-ring transition-colors" />
            <button
                onClick={() => setIsAdding(true)}
                title={t('addEventHere', language)}
                className="absolute left-1/2 -translate-x-1/2 bg-card px-2 py-0.5 rounded-full border border-border text-xs text-muted-foreground hover:border-ring hover:text-ring transition-all group-hover:scale-110 flex items-center gap-1"
            >
                <PlusIcon className="w-3 h-3" />
                {t('addEvent', language)}
            </button>
        </div>
    );
};


const SceneEditor: React.FC<{
    item: { type: 'scene', data: Scene };
    projectData: ProjectData;
    onUpdate: (item: EditableItem) => void;
    onAddEvent: (sceneId: string, type: EventType, index?: number) => void;
    onAddEvents: (sceneId: string, events: SceneEvent[]) => void;
    onUpdateEvent: (sceneId: string, event: SceneEvent) => void;
    onDeleteEvent: (sceneId: string, eventId: string) => void;
    onAddScene: () => string;
}> = ({ item, projectData, onUpdate, onAddEvent, onAddEvents, onUpdateEvent, onDeleteEvent, onAddScene }) => {
    const scene = item.data;
    const { t, language } = useSettings();
    const [commandInput, setCommandInput] = useState('');
    const { generateContent, isLoading, isAvailable } = useGemini();
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiResult, setAiResult] = useState('');

    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [completionToken, setCompletionToken] = useState('');
    const commandTextareaRef = React.useRef<HTMLTextAreaElement>(null);
    const newCursorPosRef = React.useRef<number | null>(null);

    React.useEffect(() => {
        if (newCursorPosRef.current !== null && commandTextareaRef.current) {
            const pos = newCursorPosRef.current;
            commandTextareaRef.current.setSelectionRange(pos, pos);
            newCursorPosRef.current = null;
        }
    }, [commandInput]);

    const updateSuggestions = React.useCallback((value: string, cursorPosition: number) => {
        const textBeforeCursor = value.substring(0, cursorPosition);
        const lineStartIndex = textBeforeCursor.lastIndexOf('\n') + 1;
        const currentLine = value.substring(lineStartIndex);
        const cursorIndexOnLine = cursorPosition - lineStartIndex;
    
        const textBeforeCursorOnLine = currentLine.substring(0, cursorIndexOnLine);
        const wordStartIndex = Math.max(
            textBeforeCursorOnLine.lastIndexOf(' ') + 1,
            textBeforeCursorOnLine.lastIndexOf('/') + 1,
            textBeforeCursorOnLine.lastIndexOf('->') > -1 ? textBeforeCursorOnLine.lastIndexOf('->') + 2 : -1
        );
        
        const token = textBeforeCursorOnLine.substring(wordStartIndex).trimStart();
    
        let newSuggestions: string[] = [];
    
        const lineUpToCursor = currentLine.substring(0, cursorIndexOnLine);
        const parts = lineUpToCursor.trim().split(/\s+/);
        const command = parts[0];

        if (command === '' && textBeforeCursorOnLine.trim() === '') {
            newSuggestions = ['/dialogue', '/action', '/bg', '/sfx', '/choice', '/goto'];
        } else if (command.startsWith('/')) {
            if (parts.length === 1 && !lineUpToCursor.includes(' ')) {
                 newSuggestions = ['dialogue', 'action', 'bg', 'choice', 'goto', 'sfx'].filter(c => c.startsWith(command.substring(1)));
            } else if (command === '/dialogue' && (parts.length >= 2 || lineUpToCursor.endsWith(' '))) {
                 newSuggestions = projectData.characters.filter(c => c.name.toLowerCase().includes(token.toLowerCase())).map(c => c.name);
            } else if (command === '/bg' && (parts.length >= 2 || lineUpToCursor.endsWith(' '))) {
                 newSuggestions = projectData.assets.filter(a => a.type === AssetType.BACKGROUND && a.name.toLowerCase().includes(token.toLowerCase())).map(a => a.name);
            } else if (command === '/sfx' && (parts.length >= 2 || lineUpToCursor.endsWith(' '))) {
                 newSuggestions = projectData.assets.filter(a => a.type === AssetType.SFX && a.name.toLowerCase().includes(token.toLowerCase())).map(a => a.name);
            } else if (command === '/goto' && (parts.length >= 2 || lineUpToCursor.endsWith(' '))) {
                 newSuggestions = projectData.scenes.filter(s => s.title.toLowerCase().includes(token.toLowerCase())).map(s => s.title);
            }
        } else if (lineUpToCursor.includes('->')) {
            newSuggestions = projectData.scenes.filter(s => s.title.toLowerCase().includes(token.toLowerCase())).map(s => s.title);
        }
    
        if (newSuggestions.length > 0) {
            setSuggestions(newSuggestions);
            setCompletionToken(token);
            setShowSuggestions(true);
            setActiveSuggestionIndex(0);
        } else {
            setShowSuggestions(false);
        }
    }, [projectData.characters, projectData.scenes, projectData.assets]);

    const handleCommandChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { value, selectionStart } = e.target;
        setCommandInput(value);
        updateSuggestions(value, selectionStart);
    };

    const handleSuggestionClick = (suggestion: string) => {
        const textarea = commandTextareaRef.current;
        if (!textarea) return;
        const { value, selectionStart } = textarea;
        
        const textBeforeCursor = value.substring(0, selectionStart);
        const wordStartIndex = textBeforeCursor.length - completionToken.length;
        
        const textBefore = value.substring(0, wordStartIndex);
        const textAfter = value.substring(selectionStart);
        
        const newValue = `${textBefore}${suggestion} ${textAfter}`;
    
        setCommandInput(newValue);
        setShowSuggestions(false);
    
        newCursorPosRef.current = textBefore.length + suggestion.length + 1;
        requestAnimationFrame(() => textarea.focus());
    };

    const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!showSuggestions || suggestions.length === 0) return;
    
        if (e.key === 'Tab' || e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            handleSuggestionClick(suggestions[activeSuggestionIndex]);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setShowSuggestions(false);
        }
    };

    const parseAndAddEvents = (textToParse: string) => {
        const lines = textToParse.split('\n');
        const newEvents: SceneEvent[] = [];
        let currentCommand: { type: string, params: string[], content: string[] } | null = null;
    
        const findByName = (collection: {id: string, name: string}[], name: string) => {
            if (!name) return undefined;
            const trimmedName = name.trim();
            const lname = trimmedName.toLowerCase();
            return collection.find(item => item.name.trim() === trimmedName) || collection.find(item => item.name.toLowerCase().trim() === lname);
        };
        const findSceneByName = (collection: {id: string, title: string}[], name: string) => {
            if (!name) return undefined;
            const trimmedName = name.trim();
            const lname = trimmedName.toLowerCase();
            return collection.find(item => item.title.trim() === trimmedName) || collection.find(item => item.title.toLowerCase().trim() === lname);
        };
    
        const processCurrentCommand = () => {
            if (!currentCommand) return;
            
            switch(currentCommand.type) {
                case 'dialogue': {
                    const charName = currentCommand.params.join(' ');
                    const character = findByName(projectData.characters, charName);
                    const text = currentCommand.content.join('\n').trim();
                    if (!charName && !text) break; 
                    newEvents.push({
                        id: `event-${Date.now()}-${newEvents.length}`,
                        type: EventType.DIALOGUE,
                        characterId: character ? character.id : projectData.characters[0]?.id || '',
                        text: character ? text : `[Character "${charName}" not found]\n${text}`,
                    });
                    break;
                }
                case 'action': {
                    const description = currentCommand.content.join('\n').trim();
                    if(!description) break;
                    newEvents.push({
                        id: `event-${Date.now()}-${newEvents.length}`,
                        type: EventType.ACTION,
                        description,
                    });
                    break;
                }
                case 'bg': {
                    const assetName = currentCommand.params.join(' ');
                    const asset = findByName(projectData.assets.filter(a => a.type === AssetType.BACKGROUND), assetName);
                    newEvents.push({
                        id: `event-${Date.now()}-${newEvents.length}`,
                        type: EventType.BACKGROUND_CHANGE,
                        backgroundAssetId: asset ? asset.id : '',
                    });
                    break;
                }
                case 'sfx': {
                    const assetName = currentCommand.params.join(' ');
                    const asset = findByName(projectData.assets.filter(a => a.type === AssetType.SFX), assetName);
                    newEvents.push({
                        id: `event-${Date.now()}-${newEvents.length}`,
                        type: EventType.SFX,
                        sfxAssetId: asset ? asset.id : '',
                    });
                    break;
                }
                case 'goto': {
                    const sceneName = currentCommand.params.join(' ');
                    const targetScene = findSceneByName(projectData.scenes, sceneName);
                    newEvents.push({
                        id: `event-${Date.now()}-${newEvents.length}`,
                        type: EventType.GOTO_SCENE,
                        nextSceneId: targetScene ? targetScene.id : '',
                    });
                    break;
                }
                case 'choice': {
                    const choices: Choice[] = currentCommand.content
                        .map(line => line.trim())
                        .filter(line => line.startsWith('-'))
                        .map(line => {
                            line = line.substring(1).trim();
                            const parts = line.split('->');
                            const text = parts[0].trim();
                            let nextSceneId = '';
                            if (parts.length > 1) {
                                const sceneName = parts[1].trim();
                                const targetScene = findSceneByName(projectData.scenes, sceneName);
                                if (targetScene) {
                                    nextSceneId = targetScene.id;
                                }
                            }
                            return {
                                id: `choice-${Date.now()}-${Math.random()}`,
                                text,
                                nextSceneId,
                            };
                        });
                    
                    if (choices.length > 0) {
                        newEvents.push({
                            id: `event-${Date.now()}-${newEvents.length}`,
                            type: EventType.CHOICE,
                            choices,
                        });
                    }
                    break;
                }
            }
        };
    
        for (const line of lines) {
            const trimmedLine = line.trim();
    
            if (trimmedLine.startsWith('/')) {
                processCurrentCommand();
                const commandLine = trimmedLine.substring(1).trim();

                let type: string;
                let rest: string;

                const firstSpaceIndex = commandLine.indexOf(' ');
                const firstColonIndex = commandLine.indexOf(':');

                let separatorIndex = -1;
                if (firstSpaceIndex > -1 && firstColonIndex > -1) separatorIndex = Math.min(firstSpaceIndex, firstColonIndex);
                else if (firstSpaceIndex > -1) separatorIndex = firstSpaceIndex;
                else if (firstColonIndex > -1) separatorIndex = firstColonIndex;

                if (separatorIndex === -1) {
                    type = commandLine.toLowerCase();
                    rest = '';
                } else {
                    type = commandLine.substring(0, separatorIndex).toLowerCase();
                    rest = commandLine.substring(separatorIndex + 1).trim();
                }

                let params: string[] = [];
                let content: string[] = [];

                if (type === 'action') {
                    if (rest) content.push(rest);
                } else if (type === 'dialogue') {
                    let matchedChar: Character | undefined;
                    let remainingText = rest;

                    const sortedCharacters = [...projectData.characters].sort((a, b) => b.name.length - a.name.length);

                    for (const char of sortedCharacters) {
                        const trimmedCharName = char.name.trim();
                        if (rest.toLowerCase().startsWith(trimmedCharName.toLowerCase())) {
                            const afterName = rest.substring(trimmedCharName.length).trim();
                            if (afterName.startsWith(':') || afterName === '') {
                                matchedChar = char;
                                remainingText = afterName.startsWith(':') ? afterName.substring(1).trim() : '';
                                break;
                            }
                        }
                    }

                    if (matchedChar) {
                        params.push(matchedChar.name);
                        if (remainingText) content.push(remainingText);
                    } else {
                        const colonIndex = rest.indexOf(':');
                        if (colonIndex > -1) {
                            params.push(rest.substring(0, colonIndex).trim());
                            content.push(rest.substring(colonIndex + 1).trim());
                        } else {
                            params.push(rest);
                        }
                    }
                } else if (type === 'choice') {
                    // No params or content on the command line itself
                }
                else { // bg, sfx, goto
                    params = rest.split(/\s+/).filter(p => p);
                }

                currentCommand = { type, params, content };
                
                if (content.length > 0 || (params.length > 0 && ['bg', 'sfx', 'goto'].includes(type))) {
                    processCurrentCommand();
                    currentCommand = null;
                }
                
                continue;
            }

            const dialogueMatch = trimmedLine.match(/^([^:]+):\s*(.*)$/);
            const potentialName = dialogueMatch ? dialogueMatch[1].trim() : '';
            const character = potentialName ? findByName(projectData.characters, potentialName) : null;
            
            if (dialogueMatch && character) {
                processCurrentCommand();
                const dialogueText = dialogueMatch[2].trim();
                currentCommand = {
                    type: 'dialogue',
                    params: [character.name],
                    content: []
                };
                if (dialogueText) {
                    currentCommand.content.push(dialogueText);
                    processCurrentCommand();
                    currentCommand = null;
                }
                continue;
            }
    
            if (currentCommand) {
                currentCommand.content.push(line);
            }
        }
        processCurrentCommand();
    
        if (newEvents.length > 0) {
            onAddEvents(scene.id, newEvents);
        }
    };
    
    const handleCommandParseAndAdd = () => {
        parseAndAddEvents(commandInput);
        setCommandInput('');
    };

    const handleGenerateScene = async () => {
        setAiResult('');
        const characterNames = projectData.characters.map(c => c.name).join(', ');
        const backgroundNames = projectData.assets.filter(a => a.type === AssetType.BACKGROUND).map(a => a.name).join(', ');
        const sfxNames = projectData.assets.filter(a => a.type === AssetType.SFX).map(a => a.name).join(', ');
        const sceneTitles = projectData.scenes.map(s => s.title).join(', ');
    
        const systemPrompt = `You are an assistant for a visual novel writer.
Convert the user's natural language description into a sequence of commands for the game engine.
You MUST format the output strictly using these commands, and nothing else. Do not add any explanation or intro/outro text.
- /dialogue [Character Name] or [Character Name]: [Dialogue text]
- /action: [A line describing narration or action]
- /bg [Background Asset Name]
- /sfx [Sound Effect Name]
- /goto [Scene Title]
- /choice:
  - [Choice Text] -> [Scene Title]

Here is the context of the current project:
- Available Characters: ${characterNames || 'None'}
- Available Backgrounds: ${backgroundNames || 'None'}
- Available Sound Effects: ${sfxNames || 'None'}
- Available Scenes for GOTO: ${sceneTitles || 'None'}

User's description: "${aiPrompt}"

Convert the description into commands now:
`;
        const result = await generateContent(systemPrompt);
        if (result) {
            setAiResult(result);
        }
    };

    const handleInsertSceneEvents = (text: string) => {
        setCommandInput(prev => prev ? `${prev}\n${text}` : text);
        setIsAiOpen(false);
        setAiResult('');
        setAiPrompt('');
    };


    const handleEventChange = (event: SceneEvent) => {
        onUpdateEvent(scene.id, event);
    }
    
    const renderEventEditor = (event: SceneEvent) => {
        switch (event.type) {
            case EventType.DIALOGUE:
                return (
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <select
                                value={(event as DialogueEvent).characterId}
                                onChange={(e) => handleEventChange({ ...event, characterId: e.target.value })}
                                className="flex-shrink-0 bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground focus:ring-ring focus:border-ring outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {!projectData.characters.some(c => c.id === (event as DialogueEvent).characterId) && (
                                    <option value={(event as DialogueEvent).characterId} disabled>
                                        {t('missingCharacter', language)}
                                    </option>
                                )}
                                {projectData.characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <Textarea
                                placeholder={t('dialoguePlaceholder', language)}
                                value={(event as DialogueEvent).text}
                                rows={2}
                                onChange={(e) => handleEventChange({ ...event, text: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           <AssetSelector
                                assetType={AssetType.SPRITE}
                                label={t('characterSprite', language)}
                                selectedValue={(event as DialogueEvent).spriteAssetId}
                                onValueChange={(value) => handleEventChange({ ...event, spriteAssetId: value || undefined })}
                                projectData={projectData}
                           />
                           <AssetSelector
                                assetType={AssetType.SFX}
                                label={t('soundEffect', language)}
                                selectedValue={(event as DialogueEvent).sfxAssetId}
                                onValueChange={(value) => handleEventChange({ ...event, sfxAssetId: value || undefined })}
                                projectData={projectData}
                           />
                        </div>
                    </div>
                );
            case EventType.ACTION:
                return (
                     <div className="flex flex-col gap-2">
                        <Textarea placeholder={t('actionPlaceholder', language)} value={(event as ActionEvent).description} rows={2} onChange={(e) => handleEventChange({ ...event, description: e.target.value })} />
                        <AssetSelector
                            assetType={AssetType.SFX}
                            label={t('soundEffect', language)}
                            selectedValue={(event as ActionEvent).sfxAssetId}
                            onValueChange={(value) => handleEventChange({ ...event, sfxAssetId: value || undefined })}
                            projectData={projectData}
                        />
                    </div>
                );
            case EventType.BACKGROUND_CHANGE:
                 return (
                    <div className="flex items-center gap-2">
                        <AssetSelector
                            assetType={AssetType.BACKGROUND}
                            label={t('setBackground', language)}
                            selectedValue={(event as BackgroundChangeEvent).backgroundAssetId}
                            onValueChange={(value) => handleEventChange({ ...event, backgroundAssetId: value })}
                            projectData={projectData}
                        />
                    </div>
                 );
            case EventType.GOTO_SCENE: {
                const goToSceneEvent = event as GoToSceneEvent;
                const handleSceneChange = (newSceneId: string) => {
                    if (newSceneId === '_CREATE_NEW_') {
                        const createdSceneId = onAddScene();
                        handleEventChange({ ...goToSceneEvent, nextSceneId: createdSceneId });
                    } else {
                        handleEventChange({ ...goToSceneEvent, nextSceneId: newSceneId });
                    }
                };
                return (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">→ {t('goToSceneLabel', language)}</span>
                        <select
                            value={goToSceneEvent.nextSceneId}
                            onChange={(e) => handleSceneChange(e.target.value)}
                            className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground focus:ring-ring focus:border-ring outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <option value="">({t('endStory', language)})</option>
                            {projectData.scenes.filter(s => s.id !== scene.id).map(s => (
                                <option key={s.id} value={s.id}>
                                   {t('scene', language)} {projectData.scenes.findIndex(ps => ps.id === s.id) + 1}: {s.title || t('untitledScene', language)}
                                </option>
                            ))}
                            <option value="_CREATE_NEW_" className="text-primary font-semibold">
                                {t('createNewScene', language)}
                            </option>
                        </select>
                    </div>
                );
            }
            case EventType.SFX: {
                const sfxEvent = event as SfxEvent;
                return (
                    <AssetSelector
                        assetType={AssetType.SFX}
                        label={t('soundEffect', language)}
                        selectedValue={sfxEvent.sfxAssetId}
                        onValueChange={(value) => handleEventChange({ ...sfxEvent, sfxAssetId: value })}
                        projectData={projectData}
                    />
                );
            }
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
                        text: t('newChoice', language),
                        nextSceneId: '',
                    };
                    handleEventChange({ ...choiceEvent, choices: [...choiceEvent.choices, newChoice] });
                };

                const handleDeleteChoice = (choiceIndex: number) => {
                    const newChoices = choiceEvent.choices.filter((_, i) => i !== choiceIndex);
                    handleEventChange({ ...choiceEvent, choices: newChoices });
                };

                const handleChoiceSceneChange = (choiceIndex: number, newSceneId: string) => {
                    if (newSceneId === '_CREATE_NEW_') {
                        const createdSceneId = onAddScene();
                        handleUpdateChoice(choiceIndex, { nextSceneId: createdSceneId });
                    } else {
                        handleUpdateChoice(choiceIndex, { nextSceneId: newSceneId });
                    }
                };

                return (
                    <div className="space-y-3">
                        {choiceEvent.choices.map((choice, index) => (
                            <div key={choice.id} className="p-2 bg-background border border-border rounded-md space-y-2">
                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder={t('choicePlaceholder', language)}
                                        value={choice.text}
                                        onChange={(e) => handleUpdateChoice(index, { text: e.target.value })}
                                        className="flex-grow"
                                    />
                                    <button onClick={() => handleDeleteChoice(index)} className="text-muted-foreground hover:text-danger p-1" title={t('deleteChoice', language)}>
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground flex-shrink-0">→ {t('goTo', language)}:</span>
                                    <select
                                        value={choice.nextSceneId}
                                        onChange={(e) => handleChoiceSceneChange(index, e.target.value)}
                                        className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground focus:ring-ring focus:border-ring outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        <option value="">({t('nowhere', language)})</option>
                                        {projectData.scenes.map((s, sceneIndex) => (
                                            <option key={s.id} value={s.id}>
                                               {t('scene', language)} {sceneIndex + 1}: {s.title || t('untitledScene', language)}
                                            </option>
                                        ))}
                                        <option value="_CREATE_NEW_" className="text-primary font-semibold">
                                            {t('createNewScene', language)}
                                        </option>
                                    </select>
                                </div>
                            </div>
                        ))}
                        <Button variant="secondary" size="sm" onClick={handleAddChoice} className="w-full">
                            <PlusIcon className="w-4 h-4 mr-1" />
                            {t('addChoice', language)}
                        </Button>
                    </div>
                );
            }
            default:
                return null;
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 flex p-4 space-x-4 overflow-hidden">
                <div className="flex-1 space-y-4 flex flex-col">
                    <Input
                        label={t('sceneTitle', language)}
                        value={scene.title}
                        onChange={(e) => onUpdate({ ...item, data: { ...scene, title: e.target.value } })}
                    />
                    <div className="flex-1 pt-4 border-t border-border overflow-y-auto pr-2 -mr-2">
                        <div className="space-y-1">
                            <AddEventControl index={0} sceneId={scene.id} onAddEvent={onAddEvent} />
                            {scene.events.map((event, index) => (
                                <React.Fragment key={event.id}>
                                    <div className="bg-background p-3 rounded-md border border-border">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold uppercase text-muted-foreground">{event.type}</span>
                                            <button onClick={() => onDeleteEvent(scene.id, event.id)} className="text-muted-foreground hover:text-danger" title={t('deleteEvent', language)}><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                        {renderEventEditor(event)}
                                    </div>
                                    <AddEventControl index={index + 1} sceneId={scene.id} onAddEvent={onAddEvent} />
                                </React.Fragment>
                            ))}
                        </div>
                        {scene.events.length === 0 && (
                            <div className="text-center py-6 text-sm text-muted-foreground">
                                {t('noEvents', language)}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto border-l border-border pl-4">
                    <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-md font-semibold text-muted-foreground">{t('commandMode', language)}</h4>
                        <button
                            onClick={() => setIsAiOpen(true)}
                            className="text-primary hover:text-primary-hover"
                            title={t('aiAssistant', language)}
                        >
                            <SparklesIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-2 relative">
                        <Textarea 
                            ref={commandTextareaRef}
                            value={commandInput}
                            onChange={handleCommandChange}
                            onKeyDown={handleCommandKeyDown}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                            onFocus={(e) => updateSuggestions(e.target.value, e.target.selectionStart)}
                            rows={8}
                            placeholder={t('commandModePlaceholder', language)}
                            className="font-mono text-sm"
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-10 w-[calc(100%-2px)] bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto mt-1 top-full">
                                <ul className="py-1">
                                    {suggestions.map((s, index) => (
                                        <li
                                            key={index}
                                            className={`px-3 py-1.5 cursor-pointer text-sm ${index === activeSuggestionIndex ? 'bg-secondary text-secondary-foreground' : 'hover:bg-secondary'}`}
                                            onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(s); }}
                                            onMouseEnter={() => setActiveSuggestionIndex(index)}
                                        >
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <Button onClick={handleCommandParseAndAdd} className="w-full">
                            {t('addFromText', language)}
                        </Button>
                    </div>
                </div>
            </div>
            <AiAssistantModal
                isOpen={isAiOpen}
                onClose={() => setIsAiOpen(false)}
                title={t('aiSceneGeneration', language)}
                prompt={aiPrompt}
                onPromptChange={setAiPrompt}
                onSubmit={handleGenerateScene}
                isLoading={isLoading}
                isAvailable={isAvailable}
                result={aiResult}
                onInsert={handleInsertSceneEvents}
                insertButtonText={t('insertEvents', language)}
                aiPromptPlaceholder={t('aiScenePromptPlaceholder', language)}
            />
        </div>
    );
};

const SceneViewer: React.FC<{
    item: { type: 'scene', data: Scene };
    projectData: ProjectData;
}> = ({ item, projectData }) => {
    const { t, language } = useSettings();
    const scene = item.data;

    const getEventIcon = (type: EventType) => {
        switch(type) {
            case EventType.DIALOGUE: return <DialogueIcon className="w-5 h-5 text-primary" />;
            case EventType.ACTION: return <ActionIcon className="w-5 h-5 text-primary" />;
            case EventType.BACKGROUND_CHANGE: return <ImageIcon className="w-5 h-5 text-primary" />;
            case EventType.CHOICE: return <ChoiceIcon className="w-5 h-5 text-primary" />;
            case EventType.GOTO_SCENE: return <GotoSceneIcon className="w-5 h-5 text-primary" />;
            case EventType.SFX: return <SfxIcon className="w-5 h-5 text-primary" />;
            default: return null;
        }
    };

    return (
        <div className="p-6">
            <h3 className="text-sm font-semibold text-muted-foreground">{t('sceneTitle', language)}</h3>
            <p className="text-2xl font-bold text-foreground -mt-2 mb-6">{scene.title}</p>
            
            <div className="space-y-4">
                {scene.events.map((event, index) => {
                    const findScene = (id: string) => projectData.scenes.find(s => s.id === id);
                    return (
                        <div key={event.id} className="flex gap-4 items-start">
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-muted-foreground">#{index + 1}</span>
                                <div className="mt-1">{getEventIcon(event.type)}</div>
                            </div>
                            <div className="flex-1 pt-0.5">
                                {event.type === EventType.DIALOGUE && (() => {
                                    const char = projectData.characters.find(c => c.id === event.characterId);
                                    return (
                                        <div className="bg-background p-3 rounded-md border border-border">
                                            <p className="font-bold text-foreground mb-1 flex items-center gap-2">
                                               <CharacterIcon className="w-4 h-4 text-muted-foreground" /> 
                                               {char?.name || <span className="italic text-muted-foreground">{t('missingCharacter', language)}</span>}
                                            </p>
                                            <p className="text-foreground whitespace-pre-wrap">{event.text}</p>
                                        </div>
                                    );
                                })()}
                                {event.type === EventType.ACTION && (
                                    <p className="text-muted-foreground italic">
                                        {event.description}
                                    </p>
                                )}
                                {event.type === EventType.BACKGROUND_CHANGE && (() => {
                                    const bg = projectData.assets.find(a => a.id === event.backgroundAssetId);
                                    return (
                                        <p className="text-muted-foreground">
                                           {t('backgroundChangesTo', language)} <span className="font-semibold text-foreground">{bg?.name || t('none', language)}</span>
                                        </p>
                                    );
                                })()}
                                 {event.type === EventType.GOTO_SCENE && (() => {
                                    const nextScene = findScene(event.nextSceneId);
                                    return (
                                        <p className="text-muted-foreground">
                                           {t('goToSceneLabel', language)} <span className="font-semibold text-foreground">{nextScene?.title || t('endStory', language)}</span>
                                        </p>
                                    );
                                })()}
                                {event.type === EventType.SFX && (() => {
                                    const sfx = projectData.assets.find(a => a.id === event.sfxAssetId);
                                    return (
                                        <p className="text-muted-foreground">
                                           {t('sfx', language)}: <span className="font-semibold text-foreground">{sfx?.name || t('none', language)}</span>
                                        </p>
                                    );
                                })()}
                                {event.type === EventType.CHOICE && (
                                     <div className="space-y-2">
                                        {event.choices.map(choice => {
                                            const nextScene = findScene(choice.nextSceneId);
                                            return (
                                                <div key={choice.id} className="bg-background p-3 rounded-md border border-border">
                                                    <p className="font-semibold text-foreground">"{choice.text}"</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        → {t('goesTo', language)} {nextScene?.title || <span className="italic">{t('unlinked', language)}</span>}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                 {scene.events.length === 0 && (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                        {t('noEvents', language)}
                    </div>
                )}
            </div>
        </div>
    );
};


export const EditorSheet: React.FC<EditorSheetProps> = ({ item, isReadOnly, ...props }) => {
    const { t, language } = useSettings();
    if (!item) return null;

    // FIX: Cast item.type to 'any' to satisfy TranslationKey type for `t` function.
    const itemTypeTitle = t(item.type as any, language);
    
    let itemName = '';
    if ('title' in item.data) {
        itemName = item.data.title || `${t('unnamed', language)} ${itemTypeTitle}`;
        if (item.type === 'scene') {
            itemName = item.data.title || t('untitledScene', language);
        }
    } else if ('name' in item.data) {
        itemName = item.data.name || `${t('unnamed', language)} ${itemTypeTitle}`;
    }

    const titleAction = isReadOnly ? t('view', language) : t('edit', language);

    const renderContent = () => {
        if (item.type === 'character' || item.type === 'location' || item.type === 'item' || item.type === 'memo' || item.type === 'task' || item.type === 'plot') {
            // FIX: Pass `item` directly without casting to preserve the discriminated union type.
            return isReadOnly 
                ? <DbItemViewer item={item} projectData={props.projectData} />
                : <DbItemEditor item={item} {...props} />;
        }
        if (item.type === 'asset') {
            const assetItem = item as { type: 'asset', data: Asset };
            return isReadOnly 
                ? <AssetViewer item={assetItem} />
                : <AssetEditor 
                    item={assetItem} 
                    onUpdate={props.onUpdate} 
                    onDeleteItem={props.onDeleteItem} 
                    onClose={props.onClose} 
                  />;
        }
        if (item.type === 'scene') {
            const sceneItem = item as { type: 'scene', data: Scene };
            return isReadOnly
                ? <SceneViewer item={sceneItem} projectData={props.projectData} />
                : <SceneEditor item={sceneItem} {...props} />;
        }
        return null;
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={props.onClose}>
            <div 
                data-tour-id="editor-sheet"
                className="bg-card rounded-lg shadow-2xl flex flex-col w-full h-full max-w-7xl max-h-[90vh]"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the sheet
            >
                <div className="flex justify-between items-center px-4 py-3 flex-shrink-0 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">{titleAction} {itemTypeTitle}: <span className="text-primary">{itemName}</span></h2>
                    <button onClick={props.onClose} className="p-1 rounded-full hover:bg-secondary text-muted-foreground" title={t('close', language)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="flex-1 overflow-auto">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import { EditableItem, ProjectData, DbItemType, SceneEvent, EventType, DialogueEvent, ActionEvent, BackgroundChangeEvent, ChoiceEvent, Choice, Relationship, Scene, GoToSceneEvent, Memo, Task, Character, Location, Item, Asset, AssetType } from '../types';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { useSettings } from '../contexts/SettingsContext';
import { Checkbox } from './ui/Checkbox';

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
  onAddScene: () => string;
}

const CharacterRelationshipEditor: React.FC<{
    character: { id: string, name: string, description: string };
    projectData: ProjectData;
    onAddRelationship: (relationship: Omit<Relationship, 'id'>) => void;
    onDeleteRelationship: (id: string) => void;
}> = ({ character, projectData, onAddRelationship, onDeleteRelationship }) => {
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
                            <button onClick={() => onDeleteRelationship(rel.id)} className="text-muted-foreground hover:text-danger p-1" title={t('deleteRelationship', language)}>
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
    item: { type: 'character' | 'location' | 'item' | 'memo' | 'task', data: Character | Location | Item | Memo | Task };
    projectData: ProjectData;
    onUpdate: (item: EditableItem) => void;
    onDeleteItem: (type: DbItemType, id: string) => void;
    onClose: () => void;
    onAddRelationship: (relationship: Omit<Relationship, 'id'>) => void;
    onDeleteRelationship: (id: string) => void;
}> = ({ item, projectData, onUpdate, onDeleteItem, onClose, onAddRelationship, onDeleteRelationship }) => {
    const { t, language } = useSettings();
    const hasTitle = 'title' in item.data;
    const title = hasTitle ? item.data.title : (item.data as Character).name;

    const handleDelete = () => {
        if(window.confirm(t('confirmDelete', language).replace('{name}', title))){
            onDeleteItem(item.type, item.data.id);
            onClose();
        }
    };
    
    return (
        <div className="flex h-full p-4 space-x-4">
            <div className="flex-1 space-y-4">
                <Input
                    label={hasTitle ? t('title', language) : t('name', language)}
                    value={title}
                    onChange={(e) => {
                        const newValue = e.target.value;
                        if (hasTitle) {
                            onUpdate({ ...item, data: { ...item.data, title: newValue } });
                        } else {
                            onUpdate({ ...item, data: { ...(item.data as Character), name: newValue } });
                        }
                    }}
                />
                
                {item.type === 'memo' ? (
                     <Textarea
                        label={t('content', language)}
                        value={(item.data as Memo).content}
                        rows={5}
                        onChange={(e) => onUpdate({ ...item, data: { ...item.data, content: e.target.value } })}
                    />
                ) : (
                     <Textarea
                        label={t('description', language)}
                        value={(item.data as Exclude<typeof item.data, Memo>).description}
                        rows={5}
                        onChange={(e) => onUpdate({ ...item, data: { ...item.data, description: e.target.value } })}
                    />
                )}
               
                {item.type === 'task' && (
                    <div className="pt-2">
                        <Checkbox
                            id="task-completed"
                            label={t('completed', language)}
                            checked={(item.data as Task).completed}
                            onChange={(e) => onUpdate({ ...item, data: { ...(item.data as Task), completed: e.target.checked }})}
                        />
                    </div>
                )}

                 <div className="pt-4">
                     <Button variant="danger" onClick={handleDelete} className="w-full">
                        {t('delete', language)} {t(item.type, language)}
                     </Button>
                </div>
            </div>

            {item.type === 'character' && (
                <div className="flex-1 overflow-y-auto border-l border-border pl-4">
                    <CharacterRelationshipEditor 
                        character={item.data as Character}
                        projectData={projectData}
                        onAddRelationship={onAddRelationship}
                        onDeleteRelationship={onDeleteRelationship}
                    />
                </div>
            )}
        </div>
    );
}

const AssetEditor: React.FC<{
    item: { type: 'asset', data: Asset };
    onUpdate: (item: EditableItem) => void;
    onDeleteItem: (type: DbItemType, id: string) => void;
    onClose: () => void;
}> = ({ item, onUpdate, onDeleteItem, onClose }) => {
    const { t, language } = useSettings();
    const asset = item.data;

    const handleDelete = () => {
        if(window.confirm(t('confirmDelete', language).replace('{name}', asset.name))){
            onDeleteItem(item.type, asset.id);
            onClose();
        }
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
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none"
                 >
                    {Object.values(AssetType).map(type => (
                        <option key={type} value={type}>{t(type.toLowerCase() as any, language)}</option>
                    ))}
                 </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">{t('assetPreview', language)}</label>
                <div className="w-full p-2 bg-background border border-border rounded-md min-h-[100px] flex items-center justify-center">
                    {asset.mimeType.startsWith('image/') ? (
                        <img src={asset.data} alt={asset.name} className="max-w-full max-h-64 object-contain" />
                    ) : asset.mimeType.startsWith('audio/') ? (
                        <audio controls src={asset.data} />
                    ) : (
                        <p className="text-sm text-muted-foreground">{t('noPreview', language)}</p>
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

const AssetSelector: React.FC<{
    assetType: AssetType;
    label: string;
    selectedValue: string | undefined;
    onValueChange: (newValue: string) => void;
    projectData: ProjectData;
}> = ({ assetType, label, selectedValue, onValueChange, projectData }) => {
    const { t, language } = useSettings();
    const filteredAssets = projectData.assets.filter(a => a.type === assetType);
    return (
        <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
            <select
                value={selectedValue || ''}
                onChange={(e) => onValueChange(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground focus:ring-ring focus:border-ring outline-none"
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

const SceneEditor: React.FC<{
    item: { type: 'scene', data: Scene };
    projectData: ProjectData;
    onUpdate: (item: EditableItem) => void;
    onAddEvent: (sceneId: string, type: EventType) => void;
    onUpdateEvent: (sceneId: string, event: SceneEvent) => void;
    onDeleteEvent: (sceneId: string, eventId: string) => void;
    onAddScene: () => string;
}> = ({ item, projectData, onUpdate, onAddEvent, onUpdateEvent, onDeleteEvent, onAddScene }) => {
    const scene = item.data;
    const { t, language } = useSettings();

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
                                className="flex-shrink-0 bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground focus:ring-ring focus:border-ring outline-none"
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
                            className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground focus:ring-ring focus:border-ring outline-none"
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
                                        className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground focus:ring-ring focus:border-ring outline-none"
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
        <div className="flex h-full p-4 space-x-4">
            <div className="flex-1 space-y-4">
                 <Input
                    label={t('sceneTitle', language)}
                    value={scene.title}
                    onChange={(e) => onUpdate({ ...item, data: { ...scene, title: e.target.value } })}
                />
                 <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium text-muted-foreground mb-2">{t('addNewEvent', language)}:</p>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="secondary" size="sm" onClick={() => onAddEvent(scene.id, EventType.DIALOGUE)}>{t('dialogue', language)}</Button>
                        <Button variant="secondary" size="sm" onClick={() => onAddEvent(scene.id, EventType.ACTION)}>{t('action', language)}</Button>
                        <Button variant="secondary" size="sm" onClick={() => onAddEvent(scene.id, EventType.BACKGROUND_CHANGE)}>{t('bgChange', language)}</Button>
                        <Button variant="secondary" size="sm" onClick={() => onAddEvent(scene.id, EventType.CHOICE)}>{t('choice', language)}</Button>
                        <Button variant="secondary" size="sm" onClick={() => onAddEvent(scene.id, EventType.GOTO_SCENE)}>{t('goToScene', language)}</Button>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto border-l border-border pl-4">
                 <h4 className="text-md font-semibold mb-2 text-muted-foreground">{t('events', language)}</h4>
                <div className="space-y-3">
                    {scene.events.map((event: SceneEvent) => (
                        <div key={event.id} className="bg-background p-3 rounded-md border border-border">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold uppercase text-muted-foreground">{event.type}</span>
                                <button onClick={() => onDeleteEvent(scene.id, event.id)} className="text-muted-foreground hover:text-danger" title={t('deleteEvent', language)}><TrashIcon className="w-4 h-4" /></button>
                            </div>
                            {renderEventEditor(event)}
                        </div>
                    ))}
                    {scene.events.length === 0 && (
                        <div className="text-center py-6 text-sm text-muted-foreground">
                            {t('noEvents', language)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const EditorSheet: React.FC<EditorSheetProps> = ({ item, onAddScene, ...props }) => {
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


    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={props.onClose}>
            <div 
                className="bg-card rounded-lg shadow-2xl flex flex-col w-full h-full max-w-7xl max-h-[90vh]"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the sheet
            >
                <div className="flex justify-between items-center px-4 py-3 flex-shrink-0 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">{t('edit', language)} {itemTypeTitle}: <span className="text-primary">{itemName}</span></h2>
                    <button onClick={props.onClose} className="p-1 rounded-full hover:bg-secondary text-muted-foreground" title={t('close', language)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="flex-1 overflow-auto">
                    {(item.type === 'character' || item.type === 'location' || item.type === 'item' || item.type === 'memo' || item.type === 'task') ? (
                        <DbItemEditor 
                            item={item as { type: 'character' | 'location' | 'item' | 'memo' | 'task', data: Character | Location | Item | Memo | Task }}
                            {...props}
                        />
                    ) : item.type === 'asset' ? (
                        <AssetEditor
                            item={item as { type: 'asset', data: Asset }}
                            onUpdate={props.onUpdate}
                            onDeleteItem={props.onDeleteItem}
                            onClose={props.onClose}
                        />
                    ) : (
                        <SceneEditor item={item as { type: 'scene', data: Scene }} onAddScene={onAddScene} {...props} />
                    )}
                </div>
            </div>
        </div>
    );
};
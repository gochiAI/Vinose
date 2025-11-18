import React, { useState, useRef, useEffect } from 'react';
import { ProjectData, EditableItem, DbItemType, Character, Location, Item, Memo, Task, Plot, Variable, Group, VariableType } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Checkbox } from '../ui/Checkbox';
import { useGemini } from '../../hooks/useGemini';
import { SparklesIcon } from '../icons/SparklesIcon';
import { AiAssistantModal } from '../AiAssistantModal';
import { CharacterRelationshipEditor } from './CharacterRelationshipEditor';
import { CustomPropertiesEditor, CustomPropertiesViewer } from '../shared/CustomPropertiesEditor';

declare const marked: any;
declare const DOMPurify: any;

type DbItem =
  | { type: 'character'; data: Character }
  | { type: 'location'; data: Location }
  | { type: 'item'; data: Item }
  | { type: 'memo'; data: Memo }
  | { type: 'task'; data: Task }
  | { type: 'plot'; data: Plot }
  | { type: 'variable'; data: Variable }
  | { type: 'group'; data: Group };

interface DbItemEditorProps {
    item: DbItem;
    projectData: ProjectData;
    onUpdate: (item: EditableItem) => void;
    onDeleteItem: (type: DbItemType, id: string) => void;
    onClose: () => void;
    onAddRelationship: (relationship: Omit<import('../../types').Relationship, 'id'>) => void;
    onDeleteRelationship: (id: string) => void;
}

export const DbItemEditor: React.FC<DbItemEditorProps> = ({ item, projectData, onUpdate, onDeleteItem, onClose, onAddRelationship, onDeleteRelationship }) => {
    const { t, language } = useSettings();
    const [editMode, setEditMode] = React.useState<'write' | 'preview'>('write');
    const { generateContent, isLoading } = useGemini();
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiResult, setAiResult] = useState('');

    // Define content before useEffect
    const hasContent = item.type === 'memo' || item.type === 'plot';
    const content = item.type === 'variable' || item.type === 'group' 
        ? '' 
        : hasContent ? item.data.content : item.data.description;

    if (item.type === 'variable') {
        const variable = item.data;
        const handleUpdate = (update: Partial<Variable>) => {
            onUpdate({ ...item, data: { ...variable, ...update } });
        };
        const handleTypeChange = (newType: VariableType) => {
            handleUpdate({ type: newType, initialValue: newType === VariableType.NUMBER ? 0 : false });
        };

        return (
            <div className="p-4 space-y-4">
                <Input
                    label={t('name', language)}
                    value={variable.name}
                    onChange={e => handleUpdate({ name: e.target.value })}
                />
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">{t('variableType', language)}</label>
                    <select
                        value={variable.type}
                        onChange={e => handleTypeChange(e.target.value as VariableType)}
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none"
                    >
                        <option value={VariableType.NUMBER}>{t('NUMBER', language)}</option>
                        <option value={VariableType.BOOLEAN}>{t('BOOLEAN', language)}</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">{t('initialValue', language)}</label>
                    {variable.type === VariableType.NUMBER ? (
                        <Input
                            type="number"
                            value={variable.initialValue as number}
                            onChange={e => handleUpdate({ initialValue: Number(e.target.value) || 0 })}
                        />
                    ) : (
                        <Checkbox
                            id={`var-${variable.id}-val`}
                            label={String(variable.initialValue)}
                            checked={variable.initialValue as boolean}
                            onChange={e => handleUpdate({ initialValue: e.target.checked })}
                        />
                    )}
                </div>
                <div className="pt-4">
                     <Button variant="danger" onClick={() => {
                        if(window.confirm(t('confirmDelete', language).replace('{name}', variable.name))) {
                            onDeleteItem('variable', variable.id);
                            onClose();
                        }
                     }} className="w-full">
                        {t('delete', language)} {t('variable', language)}
                     </Button>
                </div>
            </div>
        )
    }

    if (item.type === 'group') {
        const group = item.data;
        const handleUpdate = (update: Partial<Group>) => {
            onUpdate({ ...item, data: { ...group, ...update } });
        };
        
        const PRESET_COLORS = [
            '#808080', '#e11d48', '#f97316', '#f59e0b', '#84cc16', 
            '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'
        ];

        return (
            <div className="p-4 space-y-4">
                <Input
                    label={t('name', language)}
                    value={group.title}
                    onChange={e => handleUpdate({ title: e.target.value })}
                />
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">{t('color', language)}</label>
                    <div className="flex flex-wrap gap-2 p-2 bg-background border border-border rounded-md">
                        {PRESET_COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => handleUpdate({ color })}
                                className={`w-8 h-8 rounded-full transition-all ${group.color === color ? 'ring-2 ring-offset-2 ring-offset-background ring-ring' : ''}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>
                <div className="pt-4">
                     <Button variant="danger" onClick={() => {
                        if(window.confirm(t('confirmDelete', language).replace('{name}', group.title))) {
                            onDeleteItem('group', group.id);
                            onClose();
                        }
                     }} className="w-full">
                        {t('delete', language)} {t('group', language)}
                     </Button>
                </div>
            </div>
        )
    }

    const hasTitle = item.type === 'memo' || item.type === 'task' || item.type === 'plot';
    const title = hasTitle ? item.data.title : item.data.name;

    const handleDelete = () => {
        if(window.confirm(t('confirmDelete', language).replace('{name}', title))){
            onDeleteItem(item.type, item.data.id);
            onClose();
        }
    };
    
    const label = hasContent ? t('content', language) : t('description', language);

    const handleContentChange = (value: string) => {
        // FIX: Separated switch cases to avoid TypeScript inference issues with discriminated unions.
        switch (item.type) {
            case 'memo':
                onUpdate({ type: item.type, data: { ...item.data, content: value } });
                break;
            case 'plot':
                onUpdate({ type: item.type, data: { ...item.data, content: value } });
                break;
            case 'character':
                onUpdate({ type: item.type, data: { ...item.data, description: value } });
                break;
            case 'location':
                onUpdate({ type: item.type, data: { ...item.data, description: value } });
                break;
            case 'item':
                onUpdate({ type: item.type, data: { ...item.data, description: value } });
                break;
            case 'task':
                onUpdate({ type: item.type, data: { ...item.data, description: value } });
                break;
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
            <div className="flex-1 space-y-4 overflow-y-auto">
                <Input
                    label={hasTitle ? t('title', language) : t('name', language)}
                    value={title}
                    onChange={(e) => {
                        const newValue = e.target.value;
                        // FIX: Separated switch cases to avoid TypeScript inference issues with discriminated unions.
                        switch (item.type) {
                            case 'memo':
                                onUpdate({ type: item.type, data: { ...item.data, title: newValue } });
                                break;
                            case 'plot':
                                onUpdate({ type: item.type, data: { ...item.data, title: newValue } });
                                break;
                            case 'task':
                                onUpdate({ type: item.type, data: { ...item.data, title: newValue } });
                                break;
                            case 'character':
                                onUpdate({ type: item.type, data: { ...item.data, name: newValue } });
                                break;
                            case 'location':
                                onUpdate({ type: item.type, data: { ...item.data, name: newValue } });
                                break;
                            case 'item':
                                onUpdate({ type: item.type, data: { ...item.data, name: newValue } });
                                break;
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
                            rows={20}
                            onChange={(e) => handleContentChange(e.target.value)}
                        />
                    ) : (
                        <div
                            className="prose prose-sm max-w-none w-full min-h-[128px] bg-background border border-border rounded-md px-3 py-2 text-foreground overflow-y-auto"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(content || `*${t('noContentPreview', language)}*`)) }}
                        />
                    )}
                </div>
               
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
                {item.type !== 'task' && (
                    <CustomPropertiesEditor 
                        properties={item.data.properties || []}
                        onUpdateProperties={(newProps) => {
                            // FIX: Separated switch cases to avoid TypeScript inference issues with discriminated unions.
                            switch(item.type) {
                                case 'character':
                                    onUpdate({ type: item.type, data: { ...item.data, properties: newProps } });
                                    break;
                                case 'location':
                                    onUpdate({ type: item.type, data: { ...item.data, properties: newProps } });
                                    break;
                                case 'item':
                                    onUpdate({ type: item.type, data: { ...item.data, properties: newProps } });
                                    break;
                                case 'memo':
                                    onUpdate({ type: item.type, data: { ...item.data, properties: newProps } });
                                    break;
                                case 'plot':
                                    onUpdate({ type: item.type, data: { ...item.data, properties: newProps } });
                                    break;
                            }
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
                isAvailable={!!process.env.API_KEY}
                result={aiResult}
                onInsert={handleInsertDescription}
                insertButtonText={t('append', language)}
                aiPromptPlaceholder={t('aiPromptPlaceholder', language)}
            />
        </div>
    );
}

interface DbItemViewerProps {
    item: DbItem;
    projectData: ProjectData;
}

export const DbItemViewer: React.FC<DbItemViewerProps> = ({ item, projectData }) => {
    const { t, language } = useSettings();

    if (item.type === 'variable') {
        const variable = item.data;
        return (
             <div className="p-6 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">{t('name', language)}</h3>
                <p className="text-2xl font-bold text-foreground -mt-2">{variable.name}</p>
                 <h3 className="text-sm font-semibold text-muted-foreground pt-2">{t('variableType', language)}</h3>
                <p className="text-foreground -mt-2">{t(variable.type, language)}</p>
                 <h3 className="text-sm font-semibold text-muted-foreground pt-2">{t('initialValue', language)}</h3>
                <p className="text-foreground -mt-2">{String(variable.initialValue)}</p>
            </div>
        )
    }

    if (item.type === 'group') {
        const group = item.data;
        return (
             <div className="p-6 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">{t('name', language)}</h3>
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: group.color }} />
                    <p className="text-2xl font-bold text-foreground">{group.title}</p>
                </div>
            </div>
        )
    }

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
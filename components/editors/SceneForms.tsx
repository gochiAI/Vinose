
import React, { useState } from 'react';
import { ProjectData, EditableItem, Scene, SceneEvent, EventType, AssetType, BranchMode } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { useGemini } from '../../hooks/useGemini';
import { SparklesIcon } from '../icons/SparklesIcon';
import { AiAssistantModal } from '../AiAssistantModal';
import { TrashIcon } from '../icons/TrashIcon';
import { AddEventControl } from './scene/AddEventControl';
import { EventEditor } from './scene/EventEditor';
import { DialogueIcon } from '../icons/DialogueIcon';
import { ActionIcon } from '../icons/ActionIcon';
import { ImageIcon } from '../icons/ImageIcon';
import { BranchIcon } from '../icons/BranchIcon';
import { GotoSceneIcon } from '../icons/GotoSceneIcon';
import { SfxIcon } from '../icons/SfxIcon';
import { CharacterIcon } from '../icons/CharacterIcon';

declare const marked: any;
declare const DOMPurify: any;

interface SceneEditorProps {
    item: { type: 'scene', data: Scene };
    projectData: ProjectData;
    onUpdate: (item: EditableItem) => void;
    onAddEvent: (sceneId: string, type: EventType, index?: number) => void;
    onAddEvents: (sceneId: string, events: SceneEvent[]) => void;
    onUpdateEvent: (sceneId: string, event: SceneEvent) => void;
    onDeleteEvent: (sceneId: string, eventId: string) => void;
    onAddScene: () => string;
}

export const SceneEditor: React.FC<SceneEditorProps> = ({ item, projectData, onUpdate, onAddEvent, onAddEvents, onUpdateEvent, onDeleteEvent, onAddScene }) => {
    const scene = item.data;
    const { t, language } = useSettings();
    const [commandInput, setCommandInput] = useState('');
    const { generateContent, isLoading, isAvailable } = useGemini();
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiResult, setAiResult] = useState('');
    const [isCommandModeVisible, setIsCommandModeVisible] = useState(false);

    const parseAndAddEvents = (textToParse: string) => {
        const lines = textToParse.split('\n').filter(line => line.trim() !== '');
        const newEvents: SceneEvent[] = [];

        for (const line of lines) {
            const dialogueMatch = line.match(/^([^:]+):\s*(.*)$/);
            if (dialogueMatch) {
                const charName = dialogueMatch[1].trim();
                const text = dialogueMatch[2].trim();
                const character = projectData.characters.find(c => c.name.toLowerCase() === charName.toLowerCase());
                if (character) {
                    newEvents.push({
                        id: `event-${Date.now()}-${newEvents.length}`,
                        type: EventType.DIALOGUE,
                        characterId: character.id,
                        text: text,
                    });
                    continue;
                }
            }

            if (line.startsWith('/')) {
                const [command, ...params] = line.substring(1).split(' ');
                const paramStr = params.join(' ');
                switch (command.toLowerCase()) {
                    case 'action':
                        newEvents.push({ id: `event-${Date.now()}-${newEvents.length}`, type: EventType.ACTION, description: paramStr });
                        break;
                    case 'bg':
                        const bg = projectData.assets.find(a => a.name.toLowerCase() === paramStr.toLowerCase() && a.type === AssetType.BACKGROUND);
                        newEvents.push({ id: `event-${Date.now()}-${newEvents.length}`, type: EventType.BACKGROUND_CHANGE, backgroundAssetId: bg?.id || '' });
                        break;
                     case 'sfx':
                        const sfx = projectData.assets.find(a => a.name.toLowerCase() === paramStr.toLowerCase() && a.type === AssetType.SFX);
                        newEvents.push({ id: `event-${Date.now()}-${newEvents.length}`, type: EventType.SFX, sfxAssetId: sfx?.id || '' });
                        break;
                    case 'goto':
                        const scene = projectData.scenes.find(s => s.title.toLowerCase() === paramStr.toLowerCase());
                        newEvents.push({ id: `event-${Date.now()}-${newEvents.length}`, type: EventType.GOTO_SCENE, nextSceneId: scene?.id || '' });
                        break;
                    case 'choice':
                    case 'branch':
                        newEvents.push({
                            id: `event-${Date.now()}-${newEvents.length}`,
                            type: EventType.BRANCH,
// FIX: Use the BranchMode enum member instead of a string literal.
                            mode: BranchMode.PLAYER_CHOICE,
                            choices: [{id: `choice-${Date.now()}`, text: 'Choice text', nextSceneId: ''}]
                        });
                        break;
                }
                continue;
            }

            newEvents.push({
                id: `event-${Date.now()}-${newEvents.length}`,
                type: EventType.ACTION,
                description: line,
            });
        }

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

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col md:flex-row p-4 space-y-4 md:space-y-0 md:space-x-4 overflow-hidden">
                <div className="flex-1 space-y-4 flex flex-col" data-tour-id="scene-editor-main-panel">
                    <div className="space-y-2">
                        <Input
                            label={t('sceneTitle', language)}
                            value={scene.title}
                            onChange={(e) => onUpdate({ ...item, data: { ...scene, title: e.target.value } })}
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">{t('plot', language)}</label>
                                <select
                                    value={scene.plotId || ''}
                                    onChange={(e) => onUpdate({ ...item, data: { ...scene, plotId: e.target.value || undefined } })}
                                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none"
                                >
                                    <option value="">({t('none', language)})</option>
                                    {projectData.plots.map(plot => (
                                        <option key={plot.id} value={plot.id}>{plot.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">{t('group', language)}</label>
                                <select
                                    value={scene.groupId || ''}
                                    onChange={(e) => onUpdate({ ...item, data: { ...scene, groupId: e.target.value || undefined } })}
                                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none"
                                >
                                    <option value="">({t('none', language)})</option>
                                    {projectData.groups.map(group => (
                                        <option key={group.id} value={group.id}>{group.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 pt-4 border-t border-border overflow-y-auto pr-2 -mr-2">
                        <div className="space-y-1">
                            <AddEventControl index={0} sceneId={scene.id} onAddEvent={onAddEvent} />
                            {scene.events.map((event, index) => (
                                <React.Fragment key={event.id}>
                                    <div className="bg-background p-3 rounded-md border border-border">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold uppercase text-muted-foreground">{t(event.type.toLowerCase() as any, language)}</span>
                                            <button onClick={() => onDeleteEvent(scene.id, event.id)} className="text-muted-foreground hover:text-danger" title={t('deleteEvent', language)}><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                        <EventEditor 
                                            event={event}
                                            sceneId={scene.id}
                                            projectData={projectData}
                                            onUpdateEvent={onUpdateEvent}
                                            onAddScene={onAddScene}
                                        />
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
                     <div className="md:hidden mt-2">
                        <Button variant="secondary" onClick={() => setIsCommandModeVisible(v => !v)} className="w-full">
                            {t('commandMode', language)}
                        </Button>
                    </div>
                </div>
                <div className={`flex-col overflow-y-auto md:flex-1 md:border-l md:border-border md:pl-4 ${isCommandModeVisible ? 'flex' : 'hidden md:flex'}`}>
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
                    <div className="space-y-2">
                        <Textarea 
                            value={commandInput}
                            onChange={(e) => setCommandInput(e.target.value)}
                            rows={8}
                            placeholder={t('commandModePlaceholder', language)}
                            className="font-mono text-sm"
                        />
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

interface SceneViewerProps {
    item: { type: 'scene', data: Scene };
    projectData: ProjectData;
}

export const SceneViewer: React.FC<SceneViewerProps> = ({ item, projectData }) => {
    const { t, language } = useSettings();
    const scene = item.data;

    const getEventIcon = (type: EventType) => {
        switch(type) {
            case EventType.DIALOGUE: return <DialogueIcon className="w-5 h-5 text-primary" />;
            case EventType.ACTION: return <ActionIcon className="w-5 h-5 text-primary" />;
            case EventType.BACKGROUND_CHANGE: return <ImageIcon className="w-5 h-5 text-primary" />;
            case EventType.BRANCH: return <BranchIcon className="w-5 h-5 text-primary" />;
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
                                {event.type === EventType.BRANCH && (
                                     <div className="space-y-2">
                                        {(event.choices || []).map(choice => {
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

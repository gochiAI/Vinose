import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ProjectData, Scene, Variable, Condition, ConditionOperator, VariableOperation, VariableOperationAction, BranchMode, AssetType, Choice, EventType, SceneEvent } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { CloseIcon } from './icons/CloseIcon';
import { RestartIcon } from './icons/RestartIcon';
import { BugIcon } from './icons/BugIcon';
import { MoveIcon } from './icons/MoveIcon';

interface InteractivePreviewProps {
  startSceneId: string;
  projectData: ProjectData;
  onClose: () => void;
}

type PlayerState = 'IDLE' | 'PROCESSING' | 'WAITING_FOR_INPUT' | 'WAITING_FOR_CHOICE' | 'FINISHED';

const evaluateCondition = (condition: Condition, variables: Record<string, any>, projectData: ProjectData, log: (msg: string) => void): boolean => {
    const varInfo = projectData.variables.find(v => v.id === condition.variableId);
    if (!varInfo) return false;

    const varValue = variables[condition.variableId];
    if (varValue === undefined) return false;
    const condValue = condition.value;

    let result = false;
    switch (condition.operator) {
        case ConditionOperator.EQUALS: result = varValue == condValue; break;
        case ConditionOperator.NOT_EQUALS: result = varValue != condValue; break;
        case ConditionOperator.GREATER_THAN: result = typeof varValue === 'number' && typeof condValue === 'number' && varValue > condValue; break;
        case ConditionOperator.LESS_THAN: result = typeof varValue === 'number' && typeof condValue === 'number' && varValue < condValue; break;
        case ConditionOperator.GTE: result = typeof varValue === 'number' && typeof condValue === 'number' && varValue >= condValue; break;
        // FIX: The operator for LTE was incorrect, it should be `<=`.
        case ConditionOperator.LTE: result = typeof varValue === 'number' && typeof condValue === 'number' && varValue <= condValue; break;
    }
    log(`Condition: IF ${varInfo.name} ${condition.operator} ${String(condValue)} -> ${result ? 'TRUE' : 'FALSE'}`);
    return result;
};

const executeOperations = (operations: VariableOperation[], currentVars: Record<string, any>, variables: Variable[], log: (msg: string) => void): Record<string, any> => {
    const newVars = { ...currentVars };
    operations.forEach(op => {
        const varInfo = variables.find(v => v.id === op.variableId);
        if (!varInfo) return;
        const currentValue = newVars[op.variableId];
        let newValue = currentValue;
        switch (op.action) {
            case VariableOperationAction.SET:
                newValue = op.value;
                break;
            case VariableOperationAction.ADD:
                if (typeof currentValue === 'number' && typeof op.value === 'number') {
                    newValue = currentValue + op.value;
                }
                break;
            case VariableOperationAction.SUBTRACT:
                 if (typeof currentValue === 'number' && typeof op.value === 'number') {
                    newValue = currentValue - op.value;
                }
                break;
        }
        log(`Variable Op: ${varInfo.name} ${op.action} ${String(op.value)} (New value: ${newValue})`);
        newVars[op.variableId] = newValue;
    });
    return newVars;
};

const DraggableDevTools: React.FC<{
    onClose: () => void;
    variableState: Record<string, number | boolean>;
    projectData: ProjectData;
    eventLog: string[];
}> = ({ onClose, variableState, projectData, eventLog }) => {
    const { t, language } = useSettings();
    const [position, setPosition] = useState({ x: 20, y: 80 });
    const [isDragging, setIsDragging] = useState(false);
    const [activeTab, setActiveTab] = useState<'log' | 'vars'>('log');
    const dragOffset = useRef({ x: 0, y: 0 });
    const panelRef = useRef<HTMLDivElement>(null);
    const logEndRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!panelRef.current) return;
        const rect = panelRef.current.getBoundingClientRect();
        dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        setIsDragging(true);
        document.body.classList.add('dragging-no-select');
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        document.body.classList.remove('dragging-no-select');
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.classList.remove('dragging-no-select');
        };
    }, [handleMouseMove, handleMouseUp]);
    
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [eventLog]);

    return (
        <div ref={panelRef} className="absolute w-full max-w-md bg-black/80 backdrop-blur-sm rounded-lg shadow-2xl border border-white/20 text-white flex flex-col z-30" style={{ top: position.y, left: position.x }}>
            <div onMouseDown={handleMouseDown} className="flex items-center justify-between p-2 border-b border-white/20 cursor-grab" title={t('dragToMove', language)}>
                <div className="flex items-center gap-2">
                    <BugIcon className="w-5 h-5 text-green-400" />
                    <h3 className="font-bold text-sm">{t('developerTools', language)}</h3>
                </div>
                <div className="flex items-center">
                    <MoveIcon className="w-4 h-4 text-white/50" />
                    <button onClick={onClose} className="p-1 ml-2 rounded-full hover:bg-white/20"><CloseIcon className="w-4 h-4"/></button>
                </div>
            </div>
            <div className="flex bg-black/50 p-1">
                <button onClick={() => setActiveTab('log')} className={`flex-1 text-xs py-1 rounded ${activeTab === 'log' ? 'bg-white/20' : 'hover:bg-white/10'}`}>{t('eventLog', language)}</button>
                <button onClick={() => setActiveTab('vars')} className={`flex-1 text-xs py-1 rounded ${activeTab === 'vars' ? 'bg-white/20' : 'hover:bg-white/10'}`}>{t('debugVariables', language)}</button>
            </div>
            {activeTab === 'vars' && (
                 <div className="p-3 text-xs max-h-64 overflow-y-auto space-y-1">
                    {projectData.variables.length > 0 ? (
                        projectData.variables.map(v => (
                            <div key={v.id} className="flex justify-between items-center">
                                <span className="pr-4 font-semibold text-white/80">{v.name}</span>
                                <span className="font-mono">{String(variableState[v.id])}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-white/50 italic py-2">No variables defined.</p>
                    )}
                </div>
            )}
            {activeTab === 'log' && (
                <div className="p-2 text-xs font-mono max-h-64 overflow-y-auto bg-black/30">
                    {eventLog.map((log, i) => <div key={i} className="whitespace-pre-wrap leading-relaxed py-0.5">{log}</div>)}
                    <div ref={logEndRef} />
                </div>
            )}
        </div>
    );
};


export const InteractivePreview: React.FC<InteractivePreviewProps> = ({ startSceneId, projectData, onClose }) => {
    const { t, language } = useSettings();
    const [playerState, setPlayerState] = useState<PlayerState>('IDLE');
    const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
    const [currentEventIndex, setCurrentEventIndex] = useState(0);
    const [variableState, setVariableState] = useState<Record<string, number | boolean>>({});
    
    // UI State
    const [currentBackground, setCurrentBackground] = useState<string>('');
    const [activeSprite, setActiveSprite] = useState<string | null>(null);
    const [currentDialogue, setCurrentDialogue] = useState<{ character?: string; text: string } | null>(null);
    const [currentChoices, setCurrentChoices] = useState<Choice[]>([]);
    
    // Dev Tools State
    const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
    const [eventLog, setEventLog] = useState<string[]>([]);
    const audioRef = useRef<HTMLAudioElement>(null);

    const logEvent = useCallback((message: string) => {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        setEventLog(prev => [...prev.slice(-199), `[${timestamp}] ${message}`]);
    }, []);
    
    const playSfx = useCallback((sfxId?: string) => {
        if (!sfxId) return;
        const asset = projectData.assets.find(a => a.id === sfxId && a.type === AssetType.SFX);
        if (asset) {
            logEvent(`SFX: Playing "${asset.name}"`);
            if (asset.data && audioRef.current) {
                audioRef.current.src = asset.data;
                audioRef.current.play().catch(e => console.error("Error playing audio:", e));
            }
        }
    }, [projectData.assets, logEvent]);
    
    const restart = useCallback(() => {
        setEventLog([]);
        logEvent('--- PREVIEW RESTARTED ---');
        const initialVars: Record<string, number | boolean> = {};
        projectData.variables.forEach(v => {
            initialVars[v.id] = v.initialValue;
        });
        logEvent('Variables reset to initial values.');
        setVariableState(initialVars);
        
        setCurrentBackground('');
        setActiveSprite(null);
        setCurrentDialogue(null);
        setCurrentChoices([]);
        setCurrentEventIndex(0);
        setCurrentSceneId(startSceneId); 
        setPlayerState('IDLE');
    }, [startSceneId, projectData.variables, logEvent]);

    // Initial load
    useEffect(() => {
        restart();
    }, [restart]);

    // Effect to kick-start processing when a new scene is loaded
    useEffect(() => {
        if (playerState === 'IDLE' && currentSceneId) {
            const scene = projectData.scenes.find(s => s.id === currentSceneId);
            if (scene) {
                logEvent(`--- Entering Scene: "${scene.title}" ---`);
                setPlayerState('PROCESSING');
            } else {
                setPlayerState('FINISHED');
            }
        }
    }, [playerState, currentSceneId, projectData.scenes, logEvent]);

    // The main processing loop effect
    useEffect(() => {
        if (playerState !== 'PROCESSING') return;

        const scene = projectData.scenes.find(s => s.id === currentSceneId);

        // Handle end of scene
        if (!scene || currentEventIndex >= scene.events.length) {
            logEvent(`Scene "${scene?.title || 'Unknown'}" finished.`);
            logEvent(`No explicit exit found. Ending preview.`);
            setPlayerState('FINISHED');
            return;
        }

        const event = scene.events[currentEventIndex];
        
        // Process auto-run events
        switch (event.type) {
            case EventType.DIALOGUE: {
                const char = projectData.characters.find(c => c.id === event.characterId);
                logEvent(`Event ${currentEventIndex + 1}/${scene.events.length}: DIALOGUE by ${char?.name || 'Unknown'}`);
                setCurrentDialogue({ character: char?.name, text: event.text });
                const spriteAsset = projectData.assets.find(a => a.id === event.spriteAssetId);
                setActiveSprite(spriteAsset?.data || null);
                if (spriteAsset) logEvent(`  -> Show sprite: ${spriteAsset.name}`);
                playSfx(event.sfxAssetId);
                setPlayerState('WAITING_FOR_INPUT');
                return;
            }
            case EventType.ACTION: {
                logEvent(`Event ${currentEventIndex + 1}/${scene.events.length}: ACTION`);
                setCurrentDialogue({ text: event.description });
                playSfx(event.sfxAssetId);
                setPlayerState('WAITING_FOR_INPUT');
                return;
            }
            case EventType.BACKGROUND_CHANGE: {
                const bgAsset = projectData.assets.find(a => a.id === event.backgroundAssetId);
                logEvent(`Event ${currentEventIndex + 1}/${scene.events.length}: BACKGROUND_CHANGE -> ${bgAsset?.name || 'None'}`);
                setCurrentBackground(bgAsset?.data || '');
                break;
            }
            case EventType.SFX: {
                logEvent(`Event ${currentEventIndex + 1}/${scene.events.length}: SFX`);
                playSfx(event.sfxAssetId);
                break;
            }
            case EventType.GOTO_SCENE: {
                const nextScene = projectData.scenes.find(s => s.id === event.nextSceneId);
                logEvent(`Event ${currentEventIndex + 1}/${scene.events.length}: GOTO_SCENE -> ${nextScene?.title || 'End of Story'}`);
                setCurrentEventIndex(0);
                setCurrentSceneId(event.nextSceneId);
                setPlayerState('IDLE');
                return;
            }
            case EventType.BRANCH: {
                logEvent(`Event ${currentEventIndex + 1}/${scene.events.length}: BRANCH (${event.mode})`);
                if (event.mode === BranchMode.PLAYER_CHOICE && event.choices) {
                    const availableChoices = event.choices.filter(c => 
                        !c.displayCondition || evaluateCondition(c.displayCondition, variableState, projectData, logEvent)
                    );
                    logEvent(`  -> Displaying ${availableChoices.length}/${event.choices.length} choices to player.`);
                    setCurrentChoices(availableChoices);
                    setCurrentDialogue(null);
                    setPlayerState('WAITING_FOR_CHOICE');
                    return;
                }
                if (event.mode === BranchMode.AUTO_CONDITION && event.branches) {
                    let nextSceneId: string | null = null;
                    for (const branch of event.branches) {
                        if (branch.condition && evaluateCondition(branch.condition, variableState, projectData, logEvent)) {
                            nextSceneId = branch.nextSceneId;
                            break;
                        }
                    }
                    if (!nextSceneId) {
                        const elseBranch = event.branches.find(b => !b.condition);
                        if (elseBranch) {
                            logEvent(`  -> Condition fallback to ELSE branch.`);
                            nextSceneId = elseBranch.nextSceneId;
                        }
                    }

                    if (nextSceneId) {
                        const nextScene = projectData.scenes.find(s => s.id === nextSceneId);
                        logEvent(`  -> Branch taken. Going to scene: ${nextScene?.title || 'End of Story'}`);
                        setCurrentEventIndex(0);
                        setCurrentSceneId(nextSceneId);
                        setPlayerState('IDLE');
                        return;
                    }
                     logEvent(`  -> No conditions met and no ELSE branch. Continuing in scene.`);
                }
                break;
            }
        }

        // If we reached here, it was an auto-run event, so advance the index and re-process.
        setCurrentEventIndex(prev => prev + 1);
        setPlayerState('PROCESSING');

    }, [playerState, currentSceneId, currentEventIndex, variableState, projectData, logEvent, playSfx]);

    // Effect to show finished message
    useEffect(() => {
        if (playerState === 'FINISHED') {
            logEvent(`Preview Finished.`);
            setCurrentDialogue({ text: `~ ${t('endOfScene', language)} ~` });
            setActiveSprite(null);
            setCurrentChoices([]);
        }
    }, [playerState, t, logEvent]);

    const handleNextClick = () => {
        if (playerState === 'WAITING_FOR_INPUT') {
            logEvent('User advanced.');
            setCurrentDialogue(null);
            setActiveSprite(null);

            const scene = projectData.scenes.find(s => s.id === currentSceneId);
            const prevEvent = scene?.events[currentEventIndex];
            if (prevEvent && (prevEvent.type === 'DIALOGUE' || prevEvent.type === 'ACTION') && prevEvent.postExecutionActions?.length) {
                setVariableState(vars => executeOperations(prevEvent.postExecutionActions!, vars, projectData.variables, logEvent));
            }

            setCurrentEventIndex(prev => prev + 1);
            setPlayerState('PROCESSING');
        } else if (playerState === 'FINISHED') {
            onClose();
        }
    };
    
    const handleChoiceClick = (choice: Choice) => {
        if (playerState !== 'WAITING_FOR_CHOICE') return;

        logEvent(`Player chose: "${choice.text}"`);
        setCurrentChoices([]);

        // Post execution actions for the branch event itself are not a feature yet, but could be added here.

        if (choice.nextSceneId) {
            setCurrentEventIndex(0);
            setCurrentSceneId(choice.nextSceneId);
            setPlayerState('IDLE');
        } else {
            setPlayerState('FINISHED');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black font-sans text-white flex flex-col items-center justify-center animate-fade-in-fast">
             <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/70 to-transparent flex justify-between items-center z-20">
                <h2 className="text-lg font-bold pl-2">{t('previewMode', language)}</h2>
                <div className="flex items-center gap-2">
                    <button onClick={restart} className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-white/10 hover:bg-white/20 transition-colors" title={t('restart', language)}>
                        <RestartIcon className="w-4 h-4" />
                        <span>{t('restart', language)}</span>
                    </button>
                    <button onClick={() => setIsDevToolsOpen(p => !p)} className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-white/10 hover:bg-white/20 transition-colors" title={t('developerTools', language)}>
                        <BugIcon className="w-4 h-4" />
                        <span>{t('developerTools', language)}</span>
                    </button>
                    <button onClick={onClose} className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-white/10 hover:bg-white/20 transition-colors" title={t('closePreview', language)}>
                        <CloseIcon className="w-4 h-4" />
                        <span>{t('closePreview', language)}</span>
                    </button>
                </div>
            </div>

            {isDevToolsOpen && (
                <DraggableDevTools 
                    onClose={() => setIsDevToolsOpen(false)}
                    variableState={variableState}
                    projectData={projectData}
                    eventLog={eventLog}
                />
            )}
            
            <div className="w-full h-full relative" onClick={handleNextClick}>
                <div 
                    className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 z-0"
                    style={{ backgroundImage: currentBackground ? `url(${currentBackground})` : 'none', backgroundColor: '#000' }}
                />
                
                {activeSprite && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <img src={activeSprite} className="max-h-full max-w-full object-contain animate-fade-in-fast" alt="character sprite" />
                    </div>
                )}

                {playerState === 'WAITING_FOR_CHOICE' && currentChoices.length > 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/50 animate-fade-in-fast z-20">
                        {currentChoices.map(choice => (
                            <button key={choice.id} onClick={(e) => { e.stopPropagation(); handleChoiceClick(choice); }} className="px-6 py-3 bg-card text-card-foreground rounded-lg shadow-lg hover:bg-primary hover:text-primary-foreground transition-all duration-200 min-w-[300px] text-center">
                                {choice.text}
                            </button>
                        ))}
                    </div>
                )}
                
                {currentDialogue && playerState !== 'WAITING_FOR_CHOICE' && (
                    <div className="absolute bottom-0 left-0 right-0 p-8 pointer-events-none z-20">
                        <div 
                            className={`bg-black/70 p-6 rounded-xl animate-fade-in-fast cursor-pointer relative ${!currentDialogue.character ? 'text-center' : ''}`}
                            style={{minHeight: '150px'}}
                        >
                            {currentDialogue.character && (
                                <h3 className="text-2xl font-bold mb-2">{currentDialogue.character}</h3>
                            )}
                            <p className={`text-lg whitespace-pre-wrap leading-relaxed ${!currentDialogue.character ? 'italic text-white/90' : ''}`}>
                                {currentDialogue.text}
                            </p>
                             {playerState === 'WAITING_FOR_INPUT' && (
                                <div className="absolute bottom-6 right-6 w-4 h-4 border-b-2 border-r-2 border-white transform rotate-45 animate-bounce"></div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <audio ref={audioRef} />
        </div>
    );
};

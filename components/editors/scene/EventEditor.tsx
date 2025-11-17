import React, { useState, useEffect, useRef } from 'react';
import { SceneEvent, ProjectData, EventType, DialogueEvent, ActionEvent, BackgroundChangeEvent, GoToSceneEvent, SfxEvent, BranchEvent, BranchMode, Choice, ConditionalBranch, VariableOperation, VariableOperationAction, VariableType, Condition, ConditionOperator, AssetType } from '../../../types';
import { useSettings } from '../../../contexts/SettingsContext';
import { Textarea } from '../../ui/Textarea';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { AssetSelector } from './AssetSelector';
import { PlusIcon } from '../../icons/PlusIcon';
import { MinusIcon } from '../../icons/MinusIcon';
import { TrashIcon } from '../../icons/TrashIcon';

interface EventEditorProps {
    event: SceneEvent;
    sceneId: string;
    projectData: ProjectData;
    onUpdateEvent: (sceneId: string, event: SceneEvent) => void;
    onAddScene: () => string;
}

export const EventEditor: React.FC<EventEditorProps> = ({ event, sceneId, projectData, onUpdateEvent, onAddScene }) => {
    const { t, language } = useSettings();

    const handleEventChange = (updatedEvent: SceneEvent) => {
        onUpdateEvent(sceneId, updatedEvent);
    }
    
    switch (event.type) {
        case EventType.DIALOGUE:
        case EventType.ACTION: {
            const PostActionEditor: React.FC<{
                actions: VariableOperation[];
                onUpdate: (actions: VariableOperation[]) => void;
            }> = ({ actions, onUpdate }) => {
                const [isExpanded, setIsExpanded] = useState(actions.length > 0);
                const prevActionsLength = useRef(actions.length);

                useEffect(() => {
                    if (actions.length > prevActionsLength.current && !isExpanded) {
                        setIsExpanded(true);
                    }
                    prevActionsLength.current = actions.length;
                }, [actions.length, isExpanded]);

                const handleAddAction = () => {
                    const newAction: VariableOperation = {
                        variableId: projectData.variables[0]?.id || '',
                        action: VariableOperationAction.SET,
                        value: 0
                    };
                    onUpdate([...actions, newAction]);
                };

                const handleUpdateAction = (index: number, update: Partial<VariableOperation>) => {
                    const newActions = [...actions];
                    const variable = projectData.variables.find(v => v.id === (update.variableId || newActions[index].variableId));
                    if (update.variableId && variable) {
                        newActions[index] = { ...newActions[index], ...update, value: variable.type === VariableType.NUMBER ? 0 : false };
                    } else {
                        newActions[index] = { ...newActions[index], ...update };
                    }
                    onUpdate(newActions);
                };
                
                const handleDeleteAction = (index: number) => {
                    onUpdate(actions.filter((_, i) => i !== index));
                };

                return (
                    <div className="mt-2 p-2 bg-secondary/50 rounded-md space-y-2">
                        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                            <h5 className="text-xs font-bold text-muted-foreground select-none">
                                {t('postExecutionActions', language)} {actions.length > 0 ? `(${actions.length})` : ''}
                            </h5>
                            <button className="p-1 rounded-full text-muted-foreground hover:bg-border" title={isExpanded ? t('collapse', language) : t('expand', language)}>
                                {isExpanded ? <MinusIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                            </button>
                        </div>
                        
                        {isExpanded && (
                            <div className="space-y-2 animate-fade-in-fast">
                                {actions.map((action, index) => {
                                    const selectedVar = projectData.variables.find(v => v.id === action.variableId);
                                    return (
                                    <div key={index} className="flex items-center gap-2">
                                        <select value={action.variableId} onChange={e => handleUpdateAction(index, { variableId: e.target.value })} className="flex-1 bg-background border border-border rounded-md px-2 py-1 text-xs">
                                            {projectData.variables.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                        </select>
                                        <select value={action.action} onChange={e => handleUpdateAction(index, { action: e.target.value as VariableOperationAction })} className="bg-background border border-border rounded-md px-2 py-1 text-xs">
                                            <option value={VariableOperationAction.SET}>{t('SET', language)}</option>
                                            {selectedVar?.type === VariableType.NUMBER && <>
                                                <option value={VariableOperationAction.ADD}>{t('ADD', language)}</option>
                                                <option value={VariableOperationAction.SUBTRACT}>{t('SUBTRACT', language)}</option>
                                            </>}
                                        </select>
                                        {selectedVar?.type === VariableType.NUMBER ? (
                                            <Input type="number" value={action.value as number} onChange={e => handleUpdateAction(index, { value: Number(e.target.value) })} className="w-20 text-xs py-1" />
                                        ) : (
                                            <select value={String(action.value)} onChange={e => handleUpdateAction(index, { value: e.target.value === 'true' })} className="w-20 bg-background border border-border rounded-md px-2 py-1 text-xs">
                                                <option value="true">true</option>
                                                <option value="false">false</option>
                                            </select>
                                        )}
                                        <button onClick={() => handleDeleteAction(index)} className="text-muted-foreground hover:text-danger p-1"><TrashIcon className="w-3 h-3" /></button>
                                    </div>
                                )})}
                            </div>
                        )}
                        <Button variant="secondary" size="sm" onClick={handleAddAction} className="w-full text-xs"><PlusIcon className="w-3 h-3 mr-1"/>{t('addPostAction', language)}</Button>
                    </div>
                );
            };

            if (event.type === EventType.DIALOGUE) {
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
// FIX: Use the AssetType enum member instead of a string literal.
                                assetType={AssetType.SPRITE}
                                label={t('characterSprite', language)}
                                selectedValue={(event as DialogueEvent).spriteAssetId}
                                onValueChange={(value) => handleEventChange({ ...event, spriteAssetId: value || undefined })}
                                projectData={projectData}
                           />
                           <AssetSelector
// FIX: Use the AssetType enum member instead of a string literal.
                                assetType={AssetType.SFX}
                                label={t('soundEffect', language)}
                                selectedValue={(event as DialogueEvent).sfxAssetId}
                                onValueChange={(value) => handleEventChange({ ...event, sfxAssetId: value || undefined })}
                                projectData={projectData}
                           />
                        </div>
                         <PostActionEditor actions={event.postExecutionActions || []} onUpdate={actions => handleEventChange({...event, postExecutionActions: actions})} />
                    </div>
                );
            }
            return (
                 <div className="flex flex-col gap-2">
                    <Textarea placeholder={t('actionPlaceholder', language)} value={(event as ActionEvent).description} rows={2} onChange={(e) => handleEventChange({ ...event, description: e.target.value })} />
                    <AssetSelector
// FIX: Use the AssetType enum member instead of a string literal.
                        assetType={AssetType.SFX}
                        label={t('soundEffect', language)}
                        selectedValue={(event as ActionEvent).sfxAssetId}
                        onValueChange={(value) => handleEventChange({ ...event, sfxAssetId: value || undefined })}
                        projectData={projectData}
                    />
                     <PostActionEditor actions={event.postExecutionActions || []} onUpdate={actions => handleEventChange({...event, postExecutionActions: actions})} />
                </div>
            );
        }
        case EventType.BACKGROUND_CHANGE:
             return (
                <div className="flex items-center gap-2">
                    <AssetSelector
// FIX: Use the AssetType enum member instead of a string literal.
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
                        {projectData.scenes.filter(s => s.id !== sceneId).map(s => (
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
// FIX: Use the AssetType enum member instead of a string literal.
                    assetType={AssetType.SFX}
                    label={t('soundEffect', language)}
                    selectedValue={sfxEvent.sfxAssetId}
                    onValueChange={(value) => handleEventChange({ ...sfxEvent, sfxAssetId: value })}
                    projectData={projectData}
                />
            );
        }
        case EventType.BRANCH: {
            const branchEvent = event as BranchEvent;
            const setMode = (mode: BranchMode) => handleEventChange({ ...branchEvent, mode });

            const ConditionEditor: React.FC<{
                condition: Condition;
                onUpdate: (condition: Condition) => void;
                onDelete: () => void;
            }> = ({ condition, onUpdate, onDelete }) => {
                const selectedVar = projectData.variables.find(v => v.id === condition.variableId);
                
                const handleVarChange = (varId: string) => {
                    const newVar = projectData.variables.find(v => v.id === varId);
                    if(newVar) {
                        onUpdate({
                            ...condition,
                            variableId: varId,
                            value: newVar.type === VariableType.NUMBER ? 0 : false,
                            operator: ConditionOperator.EQUALS
                        });
                    }
                };

                const numberOperators = [ConditionOperator.EQUALS, ConditionOperator.NOT_EQUALS, ConditionOperator.GREATER_THAN, ConditionOperator.LESS_THAN, ConditionOperator.GTE, ConditionOperator.LTE];
                const booleanOperators = [ConditionOperator.EQUALS, ConditionOperator.NOT_EQUALS];
                
                return (
                   <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-md">
                        <select value={condition.variableId} onChange={e => handleVarChange(e.target.value)} className="flex-1 bg-background border border-border rounded-md px-2 py-1 text-xs">
                            {projectData.variables.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                        <select value={condition.operator} onChange={e => onUpdate({...condition, operator: e.target.value as ConditionOperator})} className="bg-background border border-border rounded-md px-2 py-1 text-xs">
                            {(selectedVar?.type === VariableType.NUMBER ? numberOperators : booleanOperators).map(op => <option key={op} value={op}>{t(op, language)}</option>)}
                        </select>
                        {selectedVar?.type === VariableType.NUMBER ? (
                            <Input type="number" value={condition.value as number} onChange={e => onUpdate({...condition, value: Number(e.target.value)})} className="w-20 text-xs py-1" />
                        ) : (
                            <select value={String(condition.value)} onChange={e => onUpdate({...condition, value: e.target.value === 'true'})} className="w-20 bg-background border border-border rounded-md px-2 py-1 text-xs">
                                <option value="true">true</option>
                                <option value="false">false</option>
                            </select>
                        )}
                        <button onClick={onDelete} className="p-1 text-muted-foreground hover:text-danger"><TrashIcon className="w-3 h-3" /></button>
                    </div>
                );
            };

            if (branchEvent.mode === BranchMode.PLAYER_CHOICE) {
                const choices = branchEvent.choices || [];
                const handleUpdateChoice = (choiceIndex: number, updatedChoice: Partial<Choice>) => {
                    const newChoices = [...choices];
                    newChoices[choiceIndex] = { ...newChoices[choiceIndex], ...updatedChoice };
                    handleEventChange({ ...branchEvent, choices: newChoices });
                };

                const handleAddChoice = () => {
                    const newChoice: Choice = {
                        id: `choice-${Date.now()}`,
                        text: t('newChoice', language),
                        nextSceneId: '',
                    };
                    handleEventChange({ ...branchEvent, choices: [...choices, newChoice] });
                };

                const handleDeleteChoice = (choiceIndex: number) => {
                    handleEventChange({ ...branchEvent, choices: choices.filter((_, i) => i !== choiceIndex) });
                };
                
                const handleConditionUpdate = (choiceIndex: number, condition: Condition | undefined) => {
                    if (condition) handleUpdateChoice(choiceIndex, { displayCondition: condition });
                    else {
                        const { displayCondition, ...rest } = choices[choiceIndex];
                        handleEventChange({ ...branchEvent, choices: choices.map((c, i) => i === choiceIndex ? rest : c) });
                    }
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
                    <div>
                        <div className="flex bg-secondary p-0.5 rounded-md text-xs mb-3">
                            <button onClick={() => setMode(BranchMode.PLAYER_CHOICE)} className="flex-1 px-2 py-1 rounded-sm bg-background text-foreground shadow-sm">{t('playerChoice', language)}</button>
                            <button onClick={() => setMode(BranchMode.AUTO_CONDITION)} className="flex-1 px-2 py-1 rounded-sm text-muted-foreground hover:bg-secondary-hover">{t('autoConditionBranch', language)}</button>
                        </div>
                        <div className="space-y-3">
                            {choices.map((choice, index) => (
                                <div key={choice.id} className="p-2 bg-background border border-border rounded-md space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Input placeholder={t('choicePlaceholder', language)} value={choice.text} onChange={(e) => handleUpdateChoice(index, { text: e.target.value })} className="flex-grow"/>
                                        <button onClick={() => handleDeleteChoice(index)} className="text-muted-foreground hover:text-danger p-1" title={t('deleteChoice', language)}><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                    {choice.displayCondition ? (
                                        <ConditionEditor condition={choice.displayCondition} onUpdate={c => handleConditionUpdate(index, c)} onDelete={() => handleConditionUpdate(index, undefined)} />
                                    ) : (
                                        <Button variant="secondary" size="sm" onClick={() => handleConditionUpdate(index, { variableId: projectData.variables[0]?.id || '', operator: ConditionOperator.EQUALS, value: true })} className="w-full text-xs"><PlusIcon className="w-3 h-3 mr-1" />{t('displayCondition', language)}</Button>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground flex-shrink-0">→ {t('goTo', language)}:</span>
                                        <select value={choice.nextSceneId} onChange={(e) => handleChoiceSceneChange(index, e.target.value)} className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground">
                                            <option value="">({t('nowhere', language)})</option>
                                            {projectData.scenes.map((s, sceneIndex) => (<option key={s.id} value={s.id}>{t('scene', language)} {sceneIndex + 1}: {s.title || t('untitledScene', language)}</option>))}
                                            <option value="_CREATE_NEW_" className="text-primary font-semibold">{t('createNewScene', language)}</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                            <Button variant="secondary" size="sm" onClick={handleAddChoice} className="w-full"><PlusIcon className="w-4 h-4 mr-1" />{t('addChoice', language)}</Button>
                        </div>
                    </div>
                );
            }

            if (branchEvent.mode === BranchMode.AUTO_CONDITION) {
                const branches = branchEvent.branches || [];
                const handleUpdateBranch = (index: number, updatedBranch: Partial<ConditionalBranch>) => {
                    const newBranches = [...branches];
                    newBranches[index] = { ...newBranches[index], ...updatedBranch };
                    handleEventChange({ ...branchEvent, branches: newBranches });
                };
                const handleAddBranch = () => {
                    const newBranch: ConditionalBranch = { id: `cond-${Date.now()}`, condition: { variableId: projectData.variables[0]?.id || '', operator: ConditionOperator.EQUALS, value: true }, nextSceneId: '' };
                    handleEventChange({ ...branchEvent, branches: [...branches, newBranch] });
                };
                const handleDeleteBranch = (index: number) => {
                    handleEventChange({ ...branchEvent, branches: branches.filter((_, i) => i !== index) });
                };
                const handleSceneChange = (index: number, newSceneId: string) => {
                     if (newSceneId === '_CREATE_NEW_') {
                        const createdSceneId = onAddScene();
                        handleUpdateBranch(index, { nextSceneId: createdSceneId });
                    } else {
                        handleUpdateBranch(index, { nextSceneId: newSceneId });
                    }
                };
                const handleElseSceneChange = (newSceneId: string) => {
                     if (newSceneId === '_CREATE_NEW_') {
                        const createdSceneId = onAddScene();
                        handleEventChange({ ...branchEvent, branches: branches.map(b => b.id.startsWith('else-') ? { ...b, nextSceneId: createdSceneId } : b) });
                    } else {
                         const newBranches = branches.map(b => b.id.startsWith('else-') ? { ...b, nextSceneId: newSceneId } : b)
                         if(!newBranches.some(b => b.id.startsWith('else-'))) newBranches.push({id: 'else-branch', nextSceneId: newSceneId})
                         handleEventChange({ ...branchEvent, branches: newBranches });
                    }
                };

                const elseBranch = branches.find(b => !b.condition);

                return (
                    <div>
                        <div className="flex bg-secondary p-0.5 rounded-md text-xs mb-3">
                            <button onClick={() => setMode(BranchMode.PLAYER_CHOICE)} className="flex-1 px-2 py-1 rounded-sm text-muted-foreground hover:bg-secondary-hover">{t('playerChoice', language)}</button>
                            <button onClick={() => setMode(BranchMode.AUTO_CONDITION)} className="flex-1 px-2 py-1 rounded-sm bg-background text-foreground shadow-sm">{t('autoConditionBranch', language)}</button>
                        </div>
                         <div className="space-y-3">
                            {branches.filter(b => b.condition).map((branch, index) => (
                                 <div key={branch.id} className="p-2 bg-background border border-border rounded-md space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-muted-foreground">{index === 0 ? t('ifCondition', language) : t('elseIfCondition', language)}</span>
                                        <ConditionEditor condition={branch.condition!} onUpdate={c => handleUpdateBranch(index, { condition: c })} onDelete={() => handleDeleteBranch(index)} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground flex-shrink-0">→ {t('goTo', language)}:</span>
                                        <select value={branch.nextSceneId} onChange={e => handleSceneChange(index, e.target.value)} className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground">
                                            <option value="">({t('nowhere', language)})</option>
                                            {projectData.scenes.map((s, sceneIndex) => (<option key={s.id} value={s.id}>{t('scene', language)} {sceneIndex + 1}: {s.title || t('untitledScene', language)}</option>))}
                                            <option value="_CREATE_NEW_" className="text-primary font-semibold">{t('createNewScene', language)}</option>
                                        </select>
                                    </div>
                                 </div>
                            ))}
                            <Button variant="secondary" size="sm" onClick={handleAddBranch} className="w-full"><PlusIcon className="w-4 h-4 mr-1" />{t('addCondition', language)}</Button>

                            <div className="p-2 bg-background border border-border rounded-md space-y-2">
                                <span className="text-sm font-bold text-muted-foreground">{t('elseCondition', language)}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground flex-shrink-0">→ {t('goTo', language)}:</span>
                                    <select value={elseBranch?.nextSceneId || ''} onChange={e => handleElseSceneChange(e.target.value)} className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground">
                                        <option value="">({t('nowhere', language)})</option>
                                        {projectData.scenes.map((s, sceneIndex) => (<option key={s.id} value={s.id}>{t('scene', language)} {sceneIndex + 1}: {s.title || t('untitledScene', language)}</option>))}
                                        <option value="_CREATE_NEW_" className="text-primary font-semibold">{t('createNewScene', language)}</option>
                                    </select>
                                </div>
                            </div>
                         </div>
                    </div>
                );
            }
        }
        default:
            return null;
    }
}

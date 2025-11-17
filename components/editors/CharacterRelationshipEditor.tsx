import React from 'react';
import { ProjectData, Relationship } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { PlusIcon } from '../icons/PlusIcon';
import { TrashIcon } from '../icons/TrashIcon';

export const CharacterRelationshipEditor: React.FC<{
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

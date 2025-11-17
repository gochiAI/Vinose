import React, { useState } from 'react';
import { EventType } from '../../../types';
import { useSettings } from '../../../contexts/SettingsContext';
import { Button } from '../../ui/Button';
import { PlusIcon } from '../../icons/PlusIcon';

export const AddEventControl: React.FC<{
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
                    <Button variant="secondary" size="sm" onClick={() => handleAdd(EventType.BRANCH)}>{t('branch', language)}</Button>
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

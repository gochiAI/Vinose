
import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { ShortcutAction } from '../types';
import { Button } from './ui/Button';
import { KeyboardIcon } from './icons/KeyboardIcon';

export const KeymapEditor: React.FC = () => {
    const { keymap, setKeymap, resetKeymap, t, language } = useSettings();
    const [editingAction, setEditingAction] = useState<ShortcutAction | null>(null);

    useEffect(() => {
        if (editingAction === null) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            const isMac = navigator.platform.toUpperCase().includes('MAC');
            const parts: string[] = [];

            if (isMac ? e.metaKey : e.ctrlKey) parts.push('mod');
            if (e.altKey) parts.push('alt');
            if (e.shiftKey) parts.push('shift');

            const key = e.key.toLowerCase();
            if (!['control', 'alt', 'shift', 'meta'].includes(key)) {
                if (key.startsWith('arrow')) {
                   parts.push(e.key);
                } else {
                   parts.push(key);
                }
            }

            if (parts.length > 0) {
                const newShortcut = parts.join('+');
                setKeymap({ ...keymap, [editingAction]: newShortcut });
            }
            setEditingAction(null);
        };

        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [editingAction, keymap, setKeymap]);
    
    const formatShortcut = (shortcut: string) => {
        const isMac = navigator.platform.toUpperCase().includes('MAC');
        return shortcut
            .replace('mod', isMac ? '⌘' : 'Ctrl')
            .replace('shift', '⇧')
            .replace('alt', isMac ? '⌥' : 'Alt')
            .replace('ArrowUp', '↑')
            .replace('ArrowDown', '↓')
            .replace('ArrowLeft', '←')
            .replace('ArrowRight', '→')
            .replace('Backspace', '⌫')
            .replace('Enter', '⏎')
            .split('+')
            .map(s => s.charAt(0).toUpperCase() + s.slice(1))
            .join(' + ');
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-md font-semibold text-foreground flex items-center gap-2">
                    <KeyboardIcon className="w-5 h-5"/>
                    {t('keyboardShortcuts', language)}
                </h3>
                <Button variant="secondary" size="sm" onClick={resetKeymap}>
                    {t('resetToDefaults', language)}
                </Button>
            </div>
            <div className="space-y-2 p-3 bg-background rounded-md border border-border h-full max-h-[calc(80vh-250px)] overflow-y-auto">
                <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
                    <div className="font-semibold text-muted-foreground">{t('actionWord', language)}</div>
                    <div className="font-semibold text-muted-foreground">{t('shortcut', language)}</div>
                    {Object.entries(keymap).map(([action, shortcut]) => (
                        <React.Fragment key={action}>
                            <div className="text-foreground flex items-center">{t(`action.${action}` as any, language)}</div>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setEditingAction(action as ShortcutAction)}
                                className="font-mono min-w-[120px] justify-center"
                            >
                                {editingAction === action ? `...` : formatShortcut(shortcut)}
                            </Button>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

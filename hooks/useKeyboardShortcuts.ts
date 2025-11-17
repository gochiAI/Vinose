
import { useEffect, useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { ShortcutAction } from '../types';

type ShortcutHandler = (e: KeyboardEvent) => void;
export type ShortcutMap = Partial<Record<ShortcutAction, ShortcutHandler>>;

const formatEventToShortcutString = (e: KeyboardEvent): string => {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const parts: string[] = [];

    if (isMac ? e.metaKey : e.ctrlKey) parts.push('mod');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');

    const key = e.key.toLowerCase();
    if (!['control', 'alt', 'shift', 'meta'].includes(key)) {
        if (key.startsWith('arrow')) {
            parts.push(e.key); // Keep casing for ArrowUp, etc.
        } else {
            parts.push(key);
        }
    }
    
    return parts.sort().join('+');
};

export const useKeyboardShortcuts = (handlers: ShortcutMap, active: boolean = true) => {
    const { keymap } = useSettings();

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!active) return;
        
        const target = e.target as HTMLElement;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
            return;
        }

        const pressedShortcut = formatEventToShortcutString(e);

        for (const action in keymap) {
            const assignedShortcut = keymap[action as ShortcutAction].toLowerCase().split('+').sort().join('+');
            if (pressedShortcut === assignedShortcut) {
                const handler = handlers[action as ShortcutAction];
                if (handler) {
                    e.preventDefault();
                    handler(e);
                    return;
                }
            }
        }
    }, [handlers, keymap, active]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
};

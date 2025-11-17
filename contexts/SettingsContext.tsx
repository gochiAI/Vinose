
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { translations, TranslationKey } from '../i18n';
import { ShortcutAction } from '../types';

type Theme = 'light' | 'dark';
type Language = 'en' | 'ja';
export type Keymap = Record<ShortcutAction, string>;

interface SettingsContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: TranslationKey, lang: Language) => string;
    keymap: Keymap;
    setKeymap: (keymap: Keymap) => void;
    resetKeymap: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_KEYMAP: Keymap = {
  NEW_SCENE: 'mod+N',
  NEW_CHARACTER: 'mod+shift+N',
  CLOSE_SHEET: 'Escape',
  FOCUS_SEARCH: 'mod+F',
  DELETE_NODE: 'Backspace',
  EDIT_NODE: 'Enter',
  NAV_UP: 'ArrowUp',
  NAV_DOWN: 'ArrowDown',
  NAV_LEFT: 'ArrowLeft',
  NAV_RIGHT: 'ArrowRight',
  PAN_VIEW_UP: 'mod+ArrowUp',
  PAN_VIEW_DOWN: 'mod+ArrowDown',
  PAN_VIEW_LEFT: 'mod+ArrowLeft',
  PAN_VIEW_RIGHT: 'mod+ArrowRight',
  ZOOM_IN: 'mod+=',
  ZOOM_OUT: 'mod+-',
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('vns-theme') as Theme;
        return savedTheme || 'dark';
    });

    const [language, setLanguageState] = useState<Language>(() => {
        const savedLang = localStorage.getItem('vns-language') as Language;
        return savedLang || 'en';
    });
    
    const [keymap, setKeymapState] = useState<Keymap>(() => {
        try {
            const savedKeymap = localStorage.getItem('vns-keymap');
            if (savedKeymap) {
                return { ...DEFAULT_KEYMAP, ...JSON.parse(savedKeymap) };
            }
        } catch (e) {
            console.error('Failed to parse keymap from localStorage', e);
        }
        return DEFAULT_KEYMAP;
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('vns-theme', theme);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const setLanguage = (newLanguage: Language) => {
        localStorage.setItem('vns-language', newLanguage);
        setLanguageState(newLanguage);
    };

    const t = useMemo(() => {
        return (key: TranslationKey, lang: Language) => {
            return translations[lang][key] || translations.en[key] || key;
        };
    }, []);

    const setKeymap = (newKeymap: Keymap) => {
        localStorage.setItem('vns-keymap', JSON.stringify(newKeymap));
        setKeymapState(newKeymap);
    };

    const resetKeymap = () => {
        localStorage.removeItem('vns-keymap');
        setKeymapState(DEFAULT_KEYMAP);
    };

    const value = { theme, setTheme, language, setLanguage, t, keymap, setKeymap, resetKeymap };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

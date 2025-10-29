import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { translations, TranslationKey } from '../i18n';

type Theme = 'light' | 'dark';
type Language = 'en' | 'ja';

interface SettingsContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: TranslationKey, lang: Language) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('vns-theme') as Theme;
        return savedTheme || 'dark';
    });

    const [language, setLanguageState] = useState<Language>(() => {
        const savedLang = localStorage.getItem('vns-language') as Language;
        return savedLang || 'en';
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

    const value = { theme, setTheme, language, setLanguage, t };

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
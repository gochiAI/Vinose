import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Button } from './ui/Button';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onResetData }) => {
    const { theme, setTheme, language, setLanguage, t } = useSettings();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-card rounded-lg shadow-2xl flex flex-col w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center px-4 py-3 flex-shrink-0 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">{t('settings', language)}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary text-muted-foreground" title={t('close', language)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Theme Settings */}
                    <div className="space-y-2">
                        <label className="text-md font-semibold text-foreground">{t('theme', language)}</label>
                        <div className="flex gap-2 p-1 bg-secondary rounded-lg">
                             <button
                                onClick={() => setTheme('light')}
                                className={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                                theme === 'light' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary-hover'
                                }`}
                            >
                                {t('light', language)}
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                                theme === 'dark' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary-hover'
                                }`}
                            >
                                {t('dark', language)}
                            </button>
                        </div>
                    </div>
                    
                    {/* Language Settings */}
                    <div className="space-y-2">
                        <label htmlFor="language-select" className="text-md font-semibold text-foreground">{t('language', language)}</label>
                        <select
                            id="language-select"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as 'en' | 'ja')}
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none"
                        >
                            <option value="en">English</option>
                            <option value="ja">日本語</option>
                        </select>
                    </div>

                    {/* Data Management */}
                    <div className="space-y-2 pt-4 border-t border-border">
                         <h3 className="text-md font-semibold text-danger">{t('dataManagement', language)}</h3>
                         <p className="text-sm text-muted-foreground">{t('resetWarning', language)}</p>
                         <Button variant="danger" onClick={onResetData} className="w-full">
                            {t('resetAllData', language)}
                         </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
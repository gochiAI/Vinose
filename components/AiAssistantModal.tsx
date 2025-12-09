import React from 'react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { SparklesIcon } from './icons/SparklesIcon';
import { useSettings } from '../contexts/SettingsContext';

interface AiAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    prompt: string;
    onPromptChange: (value: string) => void;
    onSubmit: () => void;
    isLoading: boolean;
    isAvailable: boolean;
    result: string;
    onInsert: (result: string) => void;
    insertButtonText: string;
    aiPromptPlaceholder: string;
    children?: React.ReactNode;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
    isOpen,
    onClose,
    title,
    prompt,
    onPromptChange,
    onSubmit,
    isLoading,
    isAvailable,
    result,
    onInsert,
    insertButtonText,
    aiPromptPlaceholder,
    children
}) => {
    const { t, language } = useSettings();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-card rounded-lg shadow-2xl flex flex-col w-full max-w-3xl max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center px-4 py-3 flex-shrink-0 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-primary"/>
                        {title}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary text-muted-foreground" title={t('close', language)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    {isAvailable ? (
                        <div className="text-center p-8 bg-background rounded-md border border-border">
                            <h3 className="text-lg font-semibold">{t('aiUnavailable', language)}</h3>
                            <p className="text-muted-foreground mt-2">{t('aiUnavailableHint', language)}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 h-full">
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">{t('yourPrompt', language)}</label>
                                    <Textarea
                                        placeholder={aiPromptPlaceholder}
                                        value={prompt}
                                        onChange={e => onPromptChange(e.target.value)}
                                        rows={5}
                                    />
                                </div>
                                {children && <div>{children}</div>}
                                <Button onClick={onSubmit} disabled={isLoading || !prompt.trim()} className="mt-auto">
                                    {isLoading ? `${t('generating', language)}...` : t('generate', language)}
                                </Button>
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-muted-foreground mb-1">{t('aiSuggestion', language)}</label>
                                <div className="flex-1 bg-background border border-border rounded-md p-3 text-sm prose prose-sm max-w-none whitespace-pre-wrap overflow-y-auto">
                                    {result ? result : <span className="text-muted-foreground">{t('aiResultPlaceholder', language)}</span>}
                                </div>
                                {result && (
                                    <Button onClick={() => onInsert(result)} variant="secondary" size="sm" className="mt-2 self-end">
                                        {insertButtonText}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

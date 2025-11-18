import React, { useState, useRef, useEffect } from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { useSettings } from '../contexts/SettingsContext';
import { DbItemType } from '../types';

export type SearchResult = {
    type: DbItemType | 'scene';
    id: string;
    primary: string;
    secondary: string;
};

interface SearchBarProps {
    query: string;
    onQueryChange: (query: string) => void;
    results: SearchResult[];
    onResultSelect: (type: DbItemType | 'scene', id: string) => void;
}

const typeToPluralKeyMap: Record<string, string> = {
    character: 'characters',
    location: 'locations',
    item: 'items',
    memo: 'memos',
    task: 'tasks',
    scene: 'scenes',
    asset: 'assets'
};

export const SearchBar: React.FC<SearchBarProps> = ({ query, onQueryChange, results, onResultSelect }) => {
    const { t, language } = useSettings();
    const [isFocused, setIsFocused] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const groupedResults = results.reduce((acc, result) => {
        (acc[result.type] = acc[result.type] || []).push(result);
        return acc;
    }, {} as Record<string, SearchResult[]>);

    const showResults = isFocused && query.length > 0;

    return (
        <div className="relative w-full max-w-lg" ref={searchRef}>
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder={t('searchPlaceholder', language)}
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    className="w-full bg-secondary border border-transparent rounded-md pl-10 pr-4 py-2 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none"
                    autoFocus
                />
            </div>
            {showResults && (
                <div className="absolute top-full mt-2 w-full bg-card rounded-lg shadow-lg border border-border max-h-96 overflow-y-auto z-50">
                    {results.length > 0 ? (
                        Object.keys(groupedResults).map((type) => (
                            <div key={type}>
                                <h4 className="text-xs font-bold uppercase text-muted-foreground px-3 pt-3 pb-1">
                                    {t(typeToPluralKeyMap[type] as any, language)}
                                </h4>
                                <ul>
                                    {groupedResults[type].map(item => (
                                        <li key={item.id}>
                                            <button
                                                onClick={() => {
                                                    onResultSelect(item.type, item.id);
                                                    setIsFocused(false);
                                                }}
                                                className="w-full text-left px-3 py-2 hover:bg-secondary flex flex-col"
                                            >
                                                <span className="font-semibold text-foreground text-sm">{item.primary}</span>
                                                <span className="text-muted-foreground text-xs truncate">{item.secondary}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            {t('noResults', language)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
import React, { useRef } from 'react';
import { ProjectData, DbItemType } from '../types';
import { Button } from './ui/Button';
import { HamburgerIcon } from './icons/HamburgerIcon';
import { GearIcon } from './icons/GearIcon';
import { useSettings } from '../contexts/SettingsContext';
import { SearchBar, SearchResult } from './SearchBar';


declare const pako: any;

interface HeaderProps {
  projectData: ProjectData;
  setData: (data: ProjectData) => void;
  updateProjectName: (name: string) => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchResults: SearchResult[];
  onSearchResultSelect: (type: DbItemType | 'scene', id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
    projectData, 
    setData, 
    updateProjectName, 
    onToggleSidebar, 
    onOpenSettings,
    searchQuery,
    onSearchQueryChange,
    searchResults,
    onSearchResultSelect
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useSettings();

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(projectData);
      const compressedData = pako.gzip(dataStr);
      const blob = new Blob([compressedData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const exportFileDefaultName = `${projectData.projectName.replace(/\s+/g, '_')}.vns`;
  
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', url);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error exporting project:", error);
        alert("Failed to export project data.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    if (file.name.endsWith('.vns')) {
        reader.onload = (e) => {
            try {
                const arrayBuffer = e.target?.result;
                if (arrayBuffer instanceof ArrayBuffer) {
                    const decompressedData = pako.ungzip(new Uint8Array(arrayBuffer));
                    const text = new TextDecoder().decode(decompressedData);
                    const parsedData = JSON.parse(text);
                    setData(parsedData);
                }
            } catch (error) {
                console.error("Error parsing .vns file:", error);
                alert("Failed to import project. The .vns file may be corrupted.");
            }
        };
        reader.readAsArrayBuffer(file);
    } else { // Fallback for old .json files
        reader.onload = (e) => {
          try {
            const text = e.target?.result;
            if (typeof text === 'string') {
              const parsedData = JSON.parse(text);
              setData(parsedData);
            }
          } catch (error) {
            console.error("Error parsing JSON file:", error);
            alert("Failed to import project. The file may be corrupted or not in the correct format.");
          }
        };
        reader.readAsText(file);
    }

    // Reset file input to allow importing the same file again
    event.target.value = '';
  };

  return (
    <header className="flex items-center justify-between p-2 bg-card border-b border-border shadow-md h-16 flex-shrink-0">
      <div className="flex items-center gap-2 w-1/3">
        <button onClick={onToggleSidebar} className="p-2 rounded-md hover:bg-secondary text-muted-foreground" title={t('toggleSidebar', language)}>
            <HamburgerIcon className="w-6 h-6" />
        </button>
        <input
            type="text"
            value={projectData.projectName}
            onChange={(e) => updateProjectName(e.target.value)}
            className="text-lg font-bold bg-transparent border-none text-foreground focus:outline-none focus:ring-0 w-full"
            data-tour-id="project-name"
        />
      </div>
      <div className="flex-1 flex justify-center px-4" data-tour-id="search-bar">
        <SearchBar 
            query={searchQuery}
            onQueryChange={onSearchQueryChange}
            results={searchResults}
            onResultSelect={onSearchResultSelect}
        />
      </div>
      <div className="flex items-center justify-end gap-2 w-1/3">
         <button onClick={onOpenSettings} className="p-2 rounded-md hover:bg-secondary text-muted-foreground" title={t('settings', language)} data-tour-id="settings-button">
            <GearIcon className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2" data-tour-id="io-buttons">
          <Button variant="secondary" size="sm" onClick={handleImportClick} title={t('importProject', language)}>
            {t('import', language)}...
          </Button>
          <Button variant="primary" size="sm" onClick={handleExport} title={t('exportProject', language)}>
            {t('export', language)} .vns
          </Button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".vns,application/json"
          className="hidden"
        />
      </div>
    </header>
  );
};
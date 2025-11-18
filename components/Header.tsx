import React, { useRef, useState } from 'react';
import { ProjectData, DbItemType } from '../types';
import { Button } from './ui/Button';
import { HamburgerIcon } from './icons/HamburgerIcon';
import { GearIcon } from './icons/GearIcon';
import { useSettings } from '../contexts/SettingsContext';
import { SearchBar, SearchResult } from './SearchBar';
import { useAuth } from '../contexts/AuthContext';
import { SearchIcon } from './icons/SearchIcon';


declare const pako: any;

interface HeaderProps {
  projectData: ProjectData;
  setData: (data: Partial<ProjectData>) => void;
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
  const { user, signInWithGoogle, signOutUser, isFirebaseAvailable } = useAuth();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isIOModalOpen, setIsIOModalOpen] = useState(false);

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
    <>
      {isMobileSearchOpen && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-lg p-2 md:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 text-muted-foreground"
            >
              ✕
            </button>
            <SearchBar 
              query={searchQuery}
              onQueryChange={onSearchQueryChange}
              results={searchResults}
              onResultSelect={(type, id) => {
                onSearchResultSelect(type, id);
                setIsMobileSearchOpen(false);
              }}
            />
          </div>
        </div>
      )}
      {isIOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsIOModalOpen(false)}>
          <div className="bg-card rounded-lg shadow-xl border border-border p-4 m-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col gap-2">
              <Button 
                variant="secondary" 
                size="md" 
                onClick={() => {
                  handleImportClick();
                  setIsIOModalOpen(false);
                }}
                className="w-full justify-start"
              >
                {t('import', language)}...
              </Button>
              <Button 
                variant="primary" 
                size="md" 
                onClick={() => {
                  handleExport();
                  setIsIOModalOpen(false);
                }}
                className="w-full justify-start"
              >
                {t('export', language)} .vns
              </Button>
            </div>
            <button 
              onClick={() => setIsIOModalOpen(false)}
              className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {t('cancel', language)}
            </button>
          </div>
        </div>
      )}
      <header className="flex items-center justify-around p-2 bg-card border-b border-border shadow-md h-16 flex-shrink-0">
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
        <div className="hidden md:flex flex-1 justify-center px-4" data-tour-id="search-bar">
          <SearchBar 
              query={searchQuery}
              onQueryChange={onSearchQueryChange}
              results={searchResults}
              onResultSelect={onSearchResultSelect}
          />
        </div>
        <button
          onClick={() => setIsMobileSearchOpen(true)}
          className="md:hidden p-2 rounded-md hover:bg-secondary text-muted-foreground"
        >
          <SearchIcon className="w-6 h-6" />
        </button>
        <div className="flex items-center justify-end gap-2">
          <div className="hidden md:flex items-center gap-2" data-tour-id="io-buttons">
            <Button variant="secondary" size="sm" onClick={handleImportClick} title={t('importProject', language)}>
              {t('import', language)}...
            </Button>
            <Button variant="primary" size="sm" onClick={handleExport} title={t('exportProject', language)}>
              {t('export', language)} .vns
            </Button>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setIsIOModalOpen(true)}
            className="md:hidden"
          >
            I/O
          </Button>
          <div className="w-px h-8 bg-border mx-2"></div>
           <button onClick={onOpenSettings} className="p-2 rounded-md hover:bg-secondary text-muted-foreground" title={t('settings', language)} data-tour-id="settings-button">
              <GearIcon className="w-6 h-6" />
          </button>
          {isFirebaseAvailable && (
              user ? (
                  <div className="group relative">
                      <img src={user.photoURL || undefined} alt="User" className="w-8 h-8 rounded-full cursor-pointer" />
                      <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-10">
                          <div className="p-2 border-b border-border">
                              <p className="text-sm font-semibold truncate">{user.displayName}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                          <button onClick={signOutUser} className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-secondary">
                              {t('logout', language)}
                          </button>
                      </div>
                  </div>
              ) : (
                  <Button variant="secondary" size="sm" onClick={signInWithGoogle}>
                      {t('login', language)}
                  </Button>
              )
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".vns,application/json"
            className="hidden"
          />
        </div>
      </header>
    </>
  );
};
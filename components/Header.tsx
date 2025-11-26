import React, { useRef, useState } from 'react';
import { ProjectData, DbItemType } from '../types';
import { Button } from './ui/Button';
import { HamburgerIcon } from './icons/HamburgerIcon';
import { GearIcon } from './icons/GearIcon';
import { useSettings } from '../contexts/SettingsContext';
import { SearchBar, SearchResult } from './SearchBar';
import { useAuth } from '../contexts/AuthContext';
import { SearchIcon } from './icons/SearchIcon';
import { useProjectData } from '../hooks/useProjectData';
import VersionControl from './VersionControl';


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
  const { currentBranch } = useProjectData();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isIOModalOpen, setIsIOModalOpen] = useState(false);
  const [isVersionControlOpen, setIsVersionControlOpen] = useState(false);

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
      {isVersionControlOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsVersionControlOpen(false)}>
          <div className="bg-card rounded-lg shadow-xl border border-border m-4 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-lg font-bold">Version Control</h2>
              <button 
                onClick={() => setIsVersionControlOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <VersionControl />
            </div>
          </div>
        </div>
      )}
      <header className="flex items-center justify-between p-2 bg-card border-b border-border shadow-md h-12 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onToggleSidebar} className="p-2 rounded-md hover:bg-secondary text-muted-foreground">
            <HamburgerIcon className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={projectData.projectName}
            onChange={(e) => updateProjectName(e.target.value)}
            className="text-lg font-bold bg-transparent border-none text-foreground focus:outline-none focus:ring-0 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:block text-sm text-muted-foreground px-2">
            Branch: {currentBranch}
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsVersionControlOpen(true)}
          >
            version
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setIsIOModalOpen(true)}
          >
            I/O
          </Button>
          <button onClick={onOpenSettings} className="p-2 rounded-md hover:bg-secondary text-muted-foreground">
            <GearIcon className="w-6 h-6" />
          </button>
        </div>
      </header>
    </>
  );
};
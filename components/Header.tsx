import React, { useRef } from 'react';
import { ProjectData } from '../types';
import { Button } from './ui/Button';
import { HamburgerIcon } from './icons/HamburgerIcon';

interface HeaderProps {
  projectData: ProjectData;
  setData: (data: ProjectData) => void;
  updateProjectName: (name: string) => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ projectData, setData, updateProjectName, onToggleSidebar }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(projectData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${projectData.projectName.replace(/\s+/g, '_')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const parsedData = JSON.parse(text);
          // Basic validation can be added here
          setData(parsedData);
        }
      } catch (error) {
        console.error("Error parsing JSON file:", error);
        alert("Failed to import project. The file may be corrupted or not in the correct format.");
      }
    };
    reader.readAsText(file);
    // Reset file input to allow importing the same file again
    event.target.value = '';
  };

  return (
    <header className="flex items-center justify-between p-2 bg-secondary border-b border-border-color shadow-md h-16 flex-shrink-0">
      <div className="flex items-center gap-2">
        <button onClick={onToggleSidebar} className="p-2 rounded-md hover:bg-tertiary text-text-secondary">
            <HamburgerIcon className="w-6 h-6" />
        </button>
        <input
            type="text"
            value={projectData.projectName}
            onChange={(e) => updateProjectName(e.target.value)}
            className="text-lg font-bold bg-transparent border-none text-text-primary focus:outline-none focus:ring-0"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={handleImportClick}>
          Import JSON
        </Button>
        <Button variant="primary" size="sm" onClick={handleExport}>
          Export JSON
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/json"
          className="hidden"
        />
      </div>
    </header>
  );
};
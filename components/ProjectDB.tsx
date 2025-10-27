import React from 'react';
import { ProjectData, DbItemType } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { LocationIcon } from './icons/LocationIcon';
import { ItemIcon } from './icons/ItemIcon';

interface ProjectDBProps {
  projectData: ProjectData;
  onSelectItem: (type: DbItemType, id: string) => void;
  onAddItem: (type: DbItemType) => string;
  selectedItemId?: string;
  activeTab: DbItemType;
  onTabChange: (tab: DbItemType) => void;
}

const TABS: { type: DbItemType, label: string, icon: React.FC<{className?: string}> }[] = [
    { type: 'location', label: 'Locations', icon: LocationIcon },
    { type: 'item', label: 'Items', icon: ItemIcon },
];

export const ProjectDB: React.FC<ProjectDBProps> = ({ projectData, onSelectItem, onAddItem, selectedItemId, activeTab, onTabChange }) => {

    const handleAddItem = (type: DbItemType) => {
        const newId = onAddItem(type);
        onSelectItem(type, newId);
    };

    const renderContent = () => {
        const items = projectData[activeTab === 'location' ? 'locations' : 'items'];
        const title = TABS.find(t => t.type === activeTab)!.label;
        
        return (
            <div className="mt-2">
                 <div className="flex justify-between items-center px-2 mb-2">
                    <h3 className="font-bold text-text-primary select-none">{title}</h3>
                    <button 
                        onClick={() => handleAddItem(activeTab)}
                        className="p-1 rounded-full hover:bg-border-color"
                        title={`Add New ${title.slice(0, -1)}`}
                    >
                        <PlusIcon className="w-4 h-4" />
                    </button>
                </div>
                <ul className="space-y-1">
                    {items.map(item => (
                        <li key={item.id}>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); onSelectItem(activeTab, item.id); }}
                                className={`block p-2 text-sm rounded-md truncate ${selectedItemId === item.id && (item.id.startsWith(activeTab.slice(0,4))) ? 'bg-accent text-white' : 'text-text-secondary hover:bg-tertiary hover:text-text-primary'}`}
                            >
                                {item.name || `Unnamed ${title.slice(0, -1)}`}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

  return (
    <aside className="w-64 bg-secondary p-2 border-r border-border-color flex-shrink-0 flex flex-col animate-slide-in">
      <h2 className="text-lg font-semibold p-2 mb-2 select-none flex-shrink-0">Project DB</h2>
      <div className="border-b border-border-color">
          <nav className="flex justify-around -mb-px">
              {TABS.map(tab => (
                  <button
                    key={tab.type}
                    onClick={() => onTabChange(tab.type)}
                    title={tab.label}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.type
                        ? 'border-accent text-accent'
                        : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-500'
                    }`}
                  >
                      <tab.icon className="w-5 h-5" />
                  </button>
              ))}
          </nav>
      </div>
      <div className="overflow-y-auto">
        {renderContent()}
      </div>
    </aside>
  );
};
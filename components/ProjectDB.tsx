import React, { useRef, useState } from 'react';
import { ProjectData, DbItemType, AssetType, Asset } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { LocationIcon } from './icons/LocationIcon';
import { ItemIcon } from './icons/ItemIcon';
import { useSettings } from '../contexts/SettingsContext';
import { MemoIcon } from './icons/MemoIcon';
import { TaskIcon } from './icons/TaskIcon';
import { ImageIcon } from './icons/ImageIcon';
import { Button } from './ui/Button';
import { ContextMenuItem } from './ui/ContextMenu';
import { PlotIcon } from './icons/PlotIcon';

type TabType = 'location' | 'item' | 'memo' | 'task' | 'asset' | 'plot';

interface ProjectDBProps {
  projectData: ProjectData;
  onEditItem: (type: DbItemType, id: string) => void;
  onViewItem: (type: DbItemType, id: string) => void;
  onAddDbItem: (type: Exclude<TabType, 'asset'>) => string;
  onAddAsset: (asset: Omit<Asset, 'id'>) => void;
  selectedItemId?: string;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  showContextMenu: (event: React.MouseEvent, items: ContextMenuItem[]) => void;
  onDeleteItem: (type: DbItemType, id: string) => void;
}


export const ProjectDB: React.FC<ProjectDBProps> = ({ projectData, onEditItem, onViewItem, onAddDbItem, onAddAsset, selectedItemId, activeTab, onTabChange, showContextMenu, onDeleteItem }) => {
    const { t, language } = useSettings();
    const [assetTypeToUpload, setAssetTypeToUpload] = useState<AssetType>(AssetType.BACKGROUND);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const TABS: { type: TabType, label: string, icon: React.FC<{className?: string}> }[] = [
        { type: 'location', label: t('locations', language), icon: LocationIcon },
        { type: 'item', label: t('items', language), icon: ItemIcon },
        { type: 'memo', label: t('memos', language), icon: MemoIcon },
        { type: 'plot', label: t('plots', language), icon: PlotIcon },
        { type: 'task', label: t('tasks', language), icon: TaskIcon },
        { type: 'asset', label: t('assets', language), icon: ImageIcon },
    ];

    const handleAddItem = (type: Exclude<TabType, 'asset'>) => {
        const newId = onAddDbItem(type);
        onEditItem(type, newId);
    };

    const handleFileUploadClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            onAddAsset({
                name: file.name.split('.').slice(0, -1).join('.'), // remove extension
                type: assetTypeToUpload,
                data: dataUrl,
                mimeType: file.type,
            });
        };
        reader.readAsDataURL(file);
        event.target.value = ''; // Reset file input
    };

    const renderContent = () => {
        if (activeTab === 'asset') {
            const assetTypes = Object.values(AssetType);
            return (
                <div className="mt-2">
                    <div className="p-2 space-y-2 border-b border-border mb-2">
                        <select
                            value={assetTypeToUpload}
                            onChange={(e) => setAssetTypeToUpload(e.target.value as AssetType)}
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none text-sm"
                        >
                            {assetTypes.map(type => (
                                // FIX: Cast type to 'any' to satisfy TranslationKey type for `t` function.
                                <option key={type} value={type}>{t(type.toLowerCase() as any, language)}</option>
                            ))}
                        </select>
                        <Button variant="secondary" size="sm" onClick={handleFileUploadClick} className="w-full">{t('upload', language)}...</Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelected}
                            className="hidden"
                            accept={assetTypeToUpload === AssetType.SFX ? 'audio/*' : 'image/*'}
                        />
                    </div>
                    {assetTypes.map(type => {
                        const assetsOfType = projectData.assets.filter(a => a.type === type);
                        if(assetsOfType.length === 0) return null;
                        
                        return (
                            <div key={type} className="mb-4">
                                {/* FIX: Cast type to 'any' to satisfy TranslationKey type for `t` function. */}
                                <h3 className="font-bold text-foreground select-none px-2 mb-1">{t(type.toLowerCase() as any, language)}</h3>
                                <ul className="space-y-1">
                                    {assetsOfType.map(asset => (
                                        <li key={asset.id}>
                                            <a
                                                href="#"
                                                onClick={(e) => { e.preventDefault(); onEditItem('asset', asset.id); }}
                                                onContextMenu={(e) => {
                                                  showContextMenu(e, [
                                                      { label: `${t('view', language)} ${t('asset', language)}`, onClick: () => onViewItem('asset', asset.id) },
                                                      { label: `${t('edit', language)} ${t('asset', language)}`, onClick: () => onEditItem('asset', asset.id) },
                                                      { isSeparator: true },
                                                      { label: `${t('delete', language)} ${t('asset', language)}`, onClick: () => onDeleteItem('asset', asset.id), isDanger: true }
                                                  ]);
                                                }}
                                                className={`block p-2 text-sm rounded-md truncate ${selectedItemId === asset.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'}`}
                                            >
                                                {/* FIX: Cast type to 'any' to satisfy TranslationKey type for `t` function. */}
                                                {asset.name || `${t('unnamed', language)} ${t(type.toLowerCase() as any, language)}`}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )
                    })}
                </div>
            )
        }

        const dataMap = {
            location: { items: projectData.locations, nameKey: 'name' as const },
            item: { items: projectData.items, nameKey: 'name' as const },
            memo: { items: projectData.memos, nameKey: 'title' as const },
            task: { items: projectData.tasks, nameKey: 'title' as const },
            plot: { items: projectData.plots, nameKey: 'title' as const },
        };
        
        const { items, nameKey } = dataMap[activeTab];
        const currentTab = TABS.find(t => t.type === activeTab)!;
        
        return (
            <div className="mt-2">
                 <div className="flex justify-between items-center px-2 mb-2">
                    <h3 className="font-bold text-foreground select-none">{currentTab.label}</h3>
                    <button 
                        onClick={() => handleAddItem(activeTab as Exclude<TabType, 'asset'>)}
                        className="p-1 rounded-full hover:bg-border"
                        title={`${t('addNew', language)} ${t(activeTab, language)}`}
                    >
                        <PlusIcon className="w-4 h-4" />
                    </button>
                </div>
                <ul className="space-y-1">
                    {items.map(item => (
                        <li key={item.id}>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); onEditItem(activeTab, item.id); }}
                                onContextMenu={(e) => {
                                    showContextMenu(e, [
                                        { label: `${t('view', language)} ${t(activeTab, language)}`, onClick: () => onViewItem(activeTab, item.id) },
                                        { label: `${t('edit', language)} ${t(activeTab, language)}`, onClick: () => onEditItem(activeTab, item.id) },
                                        { isSeparator: true },
                                        { label: `${t('delete', language)} ${t(activeTab, language)}`, onClick: () => onDeleteItem(activeTab, item.id), isDanger: true }
                                    ]);
                                }}
                                className={`block p-2 text-sm rounded-md truncate ${selectedItemId === item.id && (item.id.startsWith(activeTab.slice(0,4))) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'}`}
                            >
                                {item[nameKey] || `${t('unnamed', language)} ${t(activeTab, language)}`}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

  return (
    <aside className="w-64 bg-card p-2 border-r border-border flex-shrink-0 flex flex-col" data-tour-id="sidebar">
      <h2 className="text-lg font-semibold p-2 mb-2 select-none flex-shrink-0">{t('projectDB', language)}</h2>
      <div className="border-b border-border pb-2">
          <nav className="grid grid-cols-3 gap-1">
              {TABS.map(tab => (
                  <button
                    key={tab.type}
                    onClick={() => onTabChange(tab.type)}
                    title={tab.label}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-medium rounded-md transition-colors ${
                        activeTab === tab.type
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                      <tab.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{tab.label}</span>
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
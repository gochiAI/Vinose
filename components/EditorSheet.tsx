
import React from 'react';
import { EditableItem, ProjectData, DbItemType, SceneEvent, EventType, Relationship, Scene, Character, Location, Item, Memo, Task, Asset, Plot, Variable, Group } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { DbItemEditor, DbItemViewer } from './editors/DbItemForms';
import { AssetEditor, AssetViewer } from './editors/AssetForms';
import { SceneEditor, SceneViewer } from './editors/SceneForms';

interface EditorSheetProps {
  item: EditableItem;
  isReadOnly?: boolean;
  projectData: ProjectData;
  onUpdate: (item: EditableItem) => void;
  onClose: () => void;
  onDeleteItem: (type: DbItemType, id: string) => void;
  onAddEvent: (sceneId: string, type: EventType, index?: number) => void;
  onAddEvents: (sceneId: string, events: SceneEvent[]) => void;
  onUpdateEvent: (sceneId: string, event: SceneEvent) => void;
  onDeleteEvent: (sceneId: string, eventId: string) => void;
  onAddRelationship: (relationship: Omit<Relationship, 'id'>) => void;
  onDeleteRelationship: (id: string) => void;
  onAddScene: () => string;
}

export const EditorSheet: React.FC<EditorSheetProps> = ({ item, isReadOnly, ...props }) => {
    const { t, language } = useSettings();
    if (!item) return null;

    const itemTypeTitle = t(item.type as any, language);
    
    let itemName = '';
    if ('title' in item.data) {
        itemName = item.data.title || `${t('unnamed', language)} ${itemTypeTitle}`;
        if (item.type === 'scene') {
            itemName = item.data.title || t('untitledScene', language);
        }
    } else if ('name' in item.data) {
        itemName = item.data.name || `${t('unnamed', language)} ${itemTypeTitle}`;
    }

    const titleAction = isReadOnly ? t('view', language) : t('edit', language);

    const renderContent = () => {
        if (item.type === 'character' || item.type === 'location' || item.type === 'item' || item.type === 'memo' || item.type === 'task' || item.type === 'plot' || item.type === 'variable' || item.type === 'group') {
            const dbItem = item as { type: 'character'; data: Character } | { type: 'location'; data: Location } | { type: 'item'; data: Item } | { type: 'memo'; data: Memo } | { type: 'task'; data: Task } | { type: 'plot'; data: Plot } | { type: 'variable'; data: Variable } | { type: 'group'; data: Group };
            return isReadOnly 
                ? <DbItemViewer item={dbItem} projectData={props.projectData} />
                : <DbItemEditor 
                    item={dbItem} 
                    projectData={props.projectData}
                    onUpdate={props.onUpdate}
                    onDeleteItem={props.onDeleteItem}
                    onClose={props.onClose}
                    onAddRelationship={props.onAddRelationship}
                    onDeleteRelationship={props.onDeleteRelationship}
                  />;
        }
        if (item.type === 'asset') {
            const assetItem = item as { type: 'asset', data: Asset };
            return isReadOnly 
                ? <AssetViewer item={assetItem} />
                : <AssetEditor 
                    item={assetItem} 
                    onUpdate={props.onUpdate} 
                    onDeleteItem={props.onDeleteItem} 
                    onClose={props.onClose} 
                  />;
        }
        if (item.type === 'scene') {
            const sceneItem = item as { type: 'scene', data: Scene };
            return isReadOnly
                ? <SceneViewer item={sceneItem} projectData={props.projectData} />
                : <SceneEditor 
                    item={sceneItem} 
                    projectData={props.projectData}
                    onUpdate={props.onUpdate}
                    onAddEvent={props.onAddEvent}
                    onAddEvents={props.onAddEvents}
                    onUpdateEvent={props.onUpdateEvent}
                    onDeleteEvent={props.onDeleteEvent}
                    onAddScene={props.onAddScene}
                  />;
        }
        return null;
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center md:p-4" onClick={props.onClose}>
            <div 
                data-tour-id="editor-sheet"
                className="bg-card md:rounded-lg shadow-2xl flex flex-col w-full h-full md:max-w-7xl md:max-h-[90vh]"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the sheet
            >
                <div className="flex justify-between items-center px-4 py-3 flex-shrink-0 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">{titleAction} {itemTypeTitle}: <span className="text-primary">{itemName}</span></h2>
                    <button onClick={props.onClose} className="p-1 rounded-full hover:bg-secondary text-muted-foreground" title={t('close', language)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="flex-1 overflow-auto">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

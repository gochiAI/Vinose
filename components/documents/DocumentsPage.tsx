import React, { useState, useEffect } from 'react';
import { Folder, FileText, Table, MoreVertical, ChevronRight, Home, Search } from 'lucide-react';
import { ActionEvent } from '../../App';
import { FileItem, FileType } from '../../types';
import { DocumentEditor } from './DocumentEditor';
import { SpreadsheetEditor } from './SpreadsheetEditor';
import { initialFiles, createMockSheet } from '../../data';
import { Modal } from '../common/Modal';
import { useDatabase } from '../../contexts/DatabaseContext';

export const DocumentsPage = ({ lastAction }: { lastAction: ActionEvent | null }) => {
  const db = useDatabase();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemType, setNewItemType] = useState<FileType>('folder');
  const [newItemName, setNewItemName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Editor State
  const [openedFileId, setOpenedFileId] = useState<string | null>(null);

  // Load files from DB on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const loadedFiles = await db.getFiles();
        setFiles(loadedFiles);
      } catch (error) {
        console.error('Failed to load files:', error);
        setFiles(initialFiles);
      } finally {
        setIsLoading(false);
      }
    };
    loadFiles();
  }, [db]);

  // Handle Actions from TopBar
  useEffect(() => {
    if (lastAction) {
      if (lastAction.type === 'NEW_FOLDER') openModal('folder');
      if (lastAction.type === 'NEW_DOC') openModal('doc');
      if (lastAction.type === 'NEW_SHEET') openModal('sheet');
    }
  }, [lastAction]);

  const openModal = (type: FileType) => {
    setNewItemType(type);
    setNewItemName('');
    setIsModalOpen(true);
  };

  const handleCreate = async () => {
    if (!newItemName.trim()) return;
    
    const newItem: FileItem = {
      id: Date.now().toString(),
      parentId: currentFolderId,
      name: newItemName,
      type: newItemType,
      updatedAt: 'Just now',
      owner: 'Me',
      content: newItemType === 'doc' ? '' : newItemType === 'sheet' ? createMockSheet(['A', 'B', 'C'], []) : undefined
    };

    setFiles([...files, newItem]);
    setIsModalOpen(false);
    
    // Save to DB
    try {
      await db.saveFile(newItem);
    } catch (error) {
      console.error('Failed to save file to DB:', error);
    }
    
    // Auto-open if file
    if (newItemType !== 'folder') {
       setOpenedFileId(newItem.id);
    }
  };

  const handleFileSave = async (id: string, newContent: any, newName: string) => {
     const updatedFile = files.find(f => f.id === id);
     if (!updatedFile) return;
     
     const newFile = { ...updatedFile, content: newContent, name: newName, updatedAt: 'Just now' };
     setFiles(prev => prev.map(f => f.id === id ? newFile : f));
     
     // Save to DB
     try {
       await db.saveFile(newFile);
     } catch (error) {
       console.error('Failed to save file to DB:', error);
     }
  };

  const handleOpenFile = (file: FileItem) => {
     if (file.type === 'folder') {
        setCurrentFolderId(file.id);
     } else {
        setOpenedFileId(file.id);
     }
  };

  // --- Render Editor Views ---
  const openedFile = files.find(f => f.id === openedFileId);
  
  if (openedFileId && openedFile) {
     if (openedFile.type === 'doc') {
        return (
          <div className="absolute inset-0 z-30 bg-background-light dark:bg-background-dark">
            <DocumentEditor file={openedFile} onSave={handleFileSave} onClose={() => setOpenedFileId(null)} />
          </div>
        );
     }
     if (openedFile.type === 'sheet') {
        return (
          <div className="absolute inset-0 z-30 bg-background-light dark:bg-background-dark">
            <SpreadsheetEditor file={openedFile} onSave={handleFileSave} onClose={() => setOpenedFileId(null)} />
          </div>
        );
     }
  }

  // --- Render Explorer View ---

  const getBreadcrumbs = () => {
    const crumbs = [];
    let currentId = currentFolderId;
    while (currentId) {
      const folder = files.find(f => f.id === currentId);
      if (folder) {
        crumbs.unshift(folder);
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    return crumbs;
  };

  const currentItems = files.filter(f => {
    if (searchQuery) return f.name.toLowerCase().includes(searchQuery.toLowerCase());
    return f.parentId === currentFolderId;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'folder': return <Folder className="text-yellow-500 fill-yellow-500/20" size={24} />;
      case 'doc': return <FileText className="text-blue-500" size={24} />;
      case 'sheet': return <Table className="text-green-500" size={24} />;
      default: return <FileText size={24} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'folder': return 'Folder';
      case 'doc': return 'Document';
      case 'sheet': return 'Spreadsheet';
      default: return 'File';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden relative">
      {/* Search & Breadcrumbs Bar */}
      <div className="p-6 pb-4 flex flex-col gap-4 sticky top-0 bg-inherit z-20 border-b border-gray-200 dark:border-white/5">
        <div className="flex justify-between items-center">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 overflow-x-auto">
            <button 
              onClick={() => setCurrentFolderId(null)}
              className={`flex items-center gap-1 hover:text-primary transition-colors ${!currentFolderId ? 'text-gray-900 dark:text-white font-bold' : ''}`}
            >
              <Home size={16} />
              <span>Root</span>
            </button>
            {getBreadcrumbs().map((crumb, index, arr) => (
              <React.Fragment key={crumb.id}>
                <ChevronRight size={14} />
                <button 
                  onClick={() => setCurrentFolderId(crumb.id)}
                  className={`whitespace-nowrap hover:text-primary transition-colors ${index === arr.length - 1 ? 'text-gray-900 dark:text-white font-bold' : ''}`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>
          {/* Search & New Buttons */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search documents..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-sm bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-full focus:ring-1 focus:ring-primary focus:border-primary outline-none text-gray-900 dark:text-white w-64 transition-all"
              />
            </div>
            <button
              onClick={() => openModal('doc')}
              className="ml-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded transition-colors"
            >新規ドキュメント</button>
            <button
              onClick={() => openModal('sheet')}
              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded transition-colors"
            >新規スプレッド</button>
            <button
              onClick={() => openModal('folder')}
              className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold rounded transition-colors"
            >新規フォルダ</button>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-6 pt-2">
        {currentItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Folder size={48} className="mb-4 text-gray-700" />
            <p>This folder is empty.</p>
            <button 
              onClick={() => openModal('doc')}
              className="mt-4 text-primary hover:underline text-sm"
            >
              Create a new document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentItems.map(item => (
              <div 
                key={item.id}
                onClick={() => handleOpenFile(item)}
                className="group p-4 bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-xl hover:border-primary dark:hover:border-primary cursor-pointer transition-all hover:shadow-lg flex flex-col gap-3 relative"
              >
                 <div className="flex items-start justify-between">
                    <div className="p-3 bg-gray-50 dark:bg-surface-darker rounded-lg group-hover:bg-white/10 transition-colors">
                      {getIcon(item.type)}
                    </div>
                    <button className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10">
                      <MoreVertical size={16} />
                    </button>
                 </div>
                 
                 <div>
                   <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate mb-1">{item.name}</h3>
                   <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">{getTypeLabel(item.type)}</span>
                      <span>•</span>
                      <span>{item.updatedAt}</span>
                   </div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Create New ${newItemType === 'doc' ? 'Document' : newItemType === 'sheet' ? 'Spreadsheet' : 'Folder'}`}
        maxWidth="max-w-md"
        footer={
           <div className="flex justify-end gap-3 w-full">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreate}
                className="px-6 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-colors"
              >
                Create
              </button>
           </div>
        }
      >
         <input 
            autoFocus
            type="text" 
            placeholder={`Enter ${newItemType} name...`}
            className="w-full bg-surface-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary outline-none"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
      </Modal>
    </div>
  );
};
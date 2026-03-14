import React, { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { ActionEvent } from '../../App';
import { ExtendedCharacter, Asset } from '../../types';
import { Modal } from '../common/Modal';
import { AssetPickerModal } from '../common/AssetPickerModal';
import { Input, Label, TextArea } from '../common/Form';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useDatabase } from '../../contexts/DatabaseContext';

// バリデーションスキーマ
const characterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  role: z.string().min(1, 'Role is required').max(100, 'Role is too long'),
  age: z.string().min(1, 'Age is required'),
  height: z.string().min(1, 'Height is required'),
  description: z.string().min(1, 'Description is required'),
});

export const CharactersPage = ({ lastAction }: { lastAction: ActionEvent | null }) => {
  const db = useDatabase();
  const [characters, setCharacters] = useState<ExtendedCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [processedActionTimestamp, setProcessedActionTimestamp] = useState<number | null>(null);

  // ユーティリティ: 逆方向の関係を取得 (useMemoで最適化)
  const reverseRelationships = useMemo(() => {
    if (!selectedCharId) return [];
    return characters
      .filter(char => char.relationships.some(rel => rel.targetId === selectedCharId))
      .flatMap(char => 
        char.relationships
          .filter(rel => rel.targetId === selectedCharId)
          .map(rel => ({
            fromChar: char,
            relationship: rel
          }))
      );
  }, [characters, selectedCharId]);
  
  // Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ExtendedCharacter | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assetPickerTarget, setAssetPickerTarget] = useState<'avatar' | 'cover'>('avatar');
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    loadCharacters();
    loadAssets();
  }, [db]);

  const selectedChar = characters.find(c => c.id === selectedCharId);

  const handleAddNew = () => {
    const newChar: ExtendedCharacter = {
      id: Date.now().toString(),
      name: 'New Character',
      role: 'Role',
      age: '??',
      height: '170cm',
      avatarUrl: '',
      coverUrl: '',
      description: 'Description...',
      relationships: [],
      notes: [],
      tags: ['New']
    };
    setEditForm(newChar);
    setIsEditing(true);
  };

  // Handle actions from TopBar
  useEffect(() => {
    if (lastAction && lastAction.timestamp !== processedActionTimestamp) {
      if (lastAction.type === 'ADD_CHARACTER') {
        handleAddNew();
      }
      setProcessedActionTimestamp(lastAction.timestamp);
    }
  }, [lastAction, processedActionTimestamp]);

  const loadCharacters = async () => {
    setLoading(true);
    const data = await db.getCharacters();
    setCharacters(data);
    setLoading(false);
  };

  const loadAssets = async () => {
    try {
      const data = await db.getAssets();
      setAssets(data);
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  };

  const handleEditCurrent = () => {
    if (selectedChar) {
      setEditForm({ ...selectedChar });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!editForm) return;
    
    // バリデーション
    try {
      characterSchema.parse({
        name: editForm.name,
        role: editForm.role,
        age: editForm.age,
        height: editForm.height,
        description: editForm.description,
      });
      setValidationErrors({}); // クリアする
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach(err => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        return;
      }
    }
    
    // Optimistic Update
    const isNew = !characters.some(c => c.id === editForm.id);
    setCharacters(prev => {
      if (isNew) return [...prev, editForm];
      return prev.map(c => c.id === editForm.id ? editForm : c);
    });

    // DB Update
    try {
      await db.saveCharacter(editForm);
    } catch (error) {
      // エラー時にロールバック
      if (isNew) {
        setCharacters(prev => prev.filter(c => c.id !== editForm.id));
      } else {
        const originalChar = characters.find(c => c.id === editForm.id);
        if (originalChar) {
          setCharacters(prev => prev.map(c => c.id === editForm.id ? originalChar : c));
        }
      }
      console.error('Failed to save character:', error);
      alert('Failed to save character. Please try again.');
      return;
    }

    setIsEditing(false);
    setEditForm(null);
    setSelectedCharId(editForm.id);
  };

  const handleDelete = async () => {
    if (!selectedCharId) return;
    
    // 削除対象のキャラクターを保存（ロールバック用）
    const deletedChar = characters.find(c => c.id === selectedCharId);
    
    // 楽観的更新：先にUIから削除
    setCharacters(prev => prev.filter(c => c.id !== selectedCharId));
    setSelectedCharId(null);
    setIsEditing(false);
    setShowDeleteConfirm(false);
    
    // DB削除処理
    try {
      await db.deleteCharacter(selectedCharId);
    } catch (error) {
      // エラー時にロールバック
      if (deletedChar) {
        setCharacters(prev => [...prev, deletedChar]);
        setSelectedCharId(deletedChar.id);
      }
      console.error('Failed to delete character:', error);
      alert('Failed to delete character. Please try again.');
    }
  };

    const handleAssetSelect = (url: string) => {
      if (!editForm) return;
      if (assetPickerTarget === 'avatar') {
        setEditForm({ ...editForm, avatarUrl: url });
      } else {
        setEditForm({ ...editForm, coverUrl: url });
      }
    };

  const filteredCharacters = characters.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full overflow-hidden bg-background-light dark:bg-background-dark @container relative">
      {/* List Panel */}
      <div className={`${selectedCharId ? 'w-[320px] lg:w-[400px] border-r border-gray-200 dark:border-white/5' : 'w-full'} transition-all duration-300 flex flex-col bg-surface-light dark:bg-background-dark`}>
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-white/5 sticky top-0 bg-inherit z-10">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Search characters..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        {/* Character Grid/List */}
        <div className={`p-4 overflow-y-auto flex-1 ${selectedCharId ? 'flex flex-col gap-3' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'}`}>
          {loading ? (
             <div className="col-span-full flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
             </div>
          ) : filteredCharacters.map(char => (
            <div 
              key={char.id}
              onClick={() => setSelectedCharId(char.id)}
              className={`group relative rounded-xl overflow-hidden border transition-all cursor-pointer ${
                selectedCharId === char.id 
                  ? 'bg-primary/10 border-primary ring-1 ring-primary' 
                  : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20 hover:shadow-lg'
              } ${selectedCharId ? 'flex items-center gap-3 p-2' : 'flex flex-col'}`}
            >
              {/* Avatar */}
              <div className={`${selectedCharId ? 'size-12' : 'aspect-square w-full'} bg-gray-700 bg-cover bg-top relative`} style={{ backgroundImage: char.avatarUrl ? `url('${char.avatarUrl}')` : undefined }}>
                 {!char.avatarUrl && <div className="absolute inset-0 flex items-center justify-center text-gray-500"><span className="material-symbols-outlined">person</span></div>}
                {!selectedCharId && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                )}
              </div>
              
              {/* Info */}
              <div className={`${selectedCharId ? 'flex-1 min-w-0' : 'p-4'}`}>
                <h3 className={`font-bold text-gray-900 dark:text-white truncate ${selectedCharId ? 'text-sm' : 'text-lg mb-1'}`}>{char.name}</h3>
                <p className={`text-gray-500 dark:text-gray-400 truncate ${selectedCharId ? 'text-xs' : 'text-sm'}`}>{char.role}</p>
                
                {!selectedCharId && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {char.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedCharId && (
                 <span className="material-symbols-outlined text-gray-400 text-[18px] mr-2">chevron_right</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedChar && (
        <div className="flex-1 bg-white dark:bg-surface-darker overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col">
          {/* Header */}
          <div className="relative h-48 bg-gray-800 shrink-0">
            <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: selectedChar.coverUrl ? `url('${selectedChar.coverUrl}')` : undefined }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-surface-darker to-transparent"></div>
            
            <div className="absolute bottom-6 left-8 flex items-end gap-6">
              <div className="size-32 rounded-full border-4 border-surface-darker bg-gray-700 bg-cover bg-top shadow-xl flex items-center justify-center" style={{ backgroundImage: selectedChar.avatarUrl ? `url('${selectedChar.avatarUrl}')` : undefined }}>
                 {!selectedChar.avatarUrl && <span className="material-symbols-outlined text-4xl text-gray-500">person</span>}
              </div>
              <div className="mb-2">
                <h1 className="text-4xl font-bold text-white mb-1">{selectedChar.name}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-300">
                  <span className="bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded font-medium">{selectedChar.role}</span>
                  <span>Age: {selectedChar.age}</span>
                  <span>Height: {selectedChar.height}</span>
                </div>
              </div>
            </div>
            
            <div className="absolute top-4 right-4 flex gap-2">
               <button 
                onClick={handleEditCurrent}
                className="p-2 bg-black/50 hover:bg-primary rounded-full text-white transition-colors"
                title="Edit Character"
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
              <button 
                onClick={() => setSelectedCharId(null)}
                className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 max-w-4xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">description</span>
                    Overview
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed bg-surface-light dark:bg-surface-dark p-4 rounded-lg border border-gray-200 dark:border-white/5 whitespace-pre-wrap">
                    {selectedChar.description}
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">hub</span>
                    Relationship Diagram
                  </h3>
                  <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg border border-gray-200 dark:border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <div className="relative z-10 flex flex-col gap-4">
                       {/* Center Node (Current Char) */}
                       <div className="self-center flex flex-col items-center">
                          <div className="size-16 rounded-full bg-cover bg-top border-2 border-primary shadow-[0_0_15px_rgba(13,73,78,0.3)] flex items-center justify-center bg-gray-800" style={{ backgroundImage: selectedChar.avatarUrl ? `url('${selectedChar.avatarUrl}')` : undefined }}>
                              {!selectedChar.avatarUrl && <span className="material-symbols-outlined text-gray-500">person</span>}
                          </div>
                          <span className="mt-2 font-bold text-primary">{selectedChar.name}</span>
                       </div>

                       {/* Connections */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          {selectedChar.relationships.map((rel, idx) => {
                             const targetChar = characters.find(c => c.id === rel.targetId);
                             return (
                             <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-black/20 rounded border border-gray-200 dark:border-white/5 relative group">
                                {/* Connector Line Visual */}
                                <div className="absolute left-1/2 -top-4 w-px h-4 bg-gray-300 dark:bg-white/20 md:hidden"></div>
                                
                                <div className="size-10 rounded-full bg-gray-700 bg-cover bg-top shrink-0 flex items-center justify-center" 
                                     style={{ backgroundImage: targetChar?.avatarUrl ? `url('${targetChar.avatarUrl}')` : undefined }}>
                                     {!targetChar?.avatarUrl && <span className="material-symbols-outlined text-xs text-gray-500">person</span>}
                                </div>
                                <div>
                                   <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{rel.type}</div>
                                   <div className="font-bold text-gray-900 dark:text-white">{targetChar?.name || '(Unknown)'}</div>
                                   <div className="text-xs text-gray-500 italic">"{rel.desc}"</div>
                                </div>
                             </div>
                             );
                          })}
                       </div>
                    </div>
                  </div>
                </section>

                {/* Mutual Relationships Section */}
                {reverseRelationships.length > 0 && (
                  <section>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500">sync_alt</span>
                      How Others See {selectedChar.name}
                    </h3>
                    <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg border border-gray-200 dark:border-white/5">
                      <div className="space-y-3">
                        {reverseRelationships.map((item, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center gap-3 p-3 bg-white dark:bg-black/20 rounded border border-gray-200 dark:border-white/5 hover:border-primary/30 dark:hover:border-primary/30 transition-colors cursor-pointer"
                            onClick={() => setSelectedCharId(item.fromChar.id)}
                          >
                            <div className="size-10 rounded-full bg-gray-700 bg-cover bg-top shrink-0 flex items-center justify-center" 
                                 style={{ backgroundImage: item.fromChar.avatarUrl ? `url('${item.fromChar.avatarUrl}')` : undefined }}>
                                 {!item.fromChar.avatarUrl && <span className="material-symbols-outlined text-xs text-gray-500">person</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="font-bold text-gray-900 dark:text-white">{item.fromChar.name}</div>
                               <div className="text-xs text-gray-500 dark:text-gray-400">
                                 <span className="font-semibold text-amber-600 dark:text-amber-400 uppercase">{item.relationship.type}</span>
                                 {item.relationship.desc && <span className="italic ml-1">"{item.relationship.desc}"</span>}
                               </div>
                            </div>
                            <span className="material-symbols-outlined text-gray-400 text-[16px]">arrow_forward</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}
              </div>

              {/* Sidebar Column */}
              <div className="space-y-8">
                <section>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400">sticky_note_2</span>
                    Notes
                  </h3>
                  <div className="space-y-3">
                    {selectedChar.notes.map((note, idx) => (
                      <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 p-3 rounded text-sm text-gray-800 dark:text-gray-300">
                        {note}
                      </div>
                    ))}
                    <button className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded text-gray-500 hover:border-primary hover:text-primary transition-colors text-sm font-bold flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Add Note
                    </button>
                  </div>
                </section>

                <section>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Tags</h3>
                   <div className="flex flex-wrap gap-2">
                      {selectedChar.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 rounded-full bg-surface-light dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-600 dark:text-gray-300">
                          #{tag}
                        </span>
                      ))}
                      <button className="px-2 py-1 rounded-full border border-dashed border-gray-400 text-gray-400 hover:text-white hover:border-white transition-colors">
                        <span className="material-symbols-outlined text-[14px]">add</span>
                      </button>
                   </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditing && !!editForm}
        onClose={() => {
          setIsEditing(false);
          setEditForm(null);
          setValidationErrors({});
        }}
        title={editForm && characters.some(c => c.id === editForm.id) ? 'Edit Character' : 'New Character'}
        footer={
           editForm && (
              <>
               {characters.some(c => c.id === editForm.id) ? (
                 <button onClick={() => setShowDeleteConfirm(true)} className="text-red-400 hover:text-red-300 font-bold px-4 py-2 hover:bg-red-900/20 rounded">Delete</button>
               ) : (
                 <div></div>
               )}
               <div className="flex gap-3">
                 <button onClick={() => { setIsEditing(false); setEditForm(null); setValidationErrors({}); }} className="px-4 py-2 text-gray-300 hover:bg-white/5 rounded">Cancel</button>
                 <button onClick={handleSave} className="px-6 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded shadow-lg shadow-primary/20">Save Character</button>
               </div>
             </>
           )
        }
      >
        {editForm && (
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label>Name</Label>
                     <Input 
                       type="text" 
                       value={editForm.name} 
                       onChange={e => setEditForm({...editForm, name: e.target.value})} 
                       className={validationErrors.name ? 'border-red-500' : ''}
                     />
                     {validationErrors.name && (
                       <p className="text-red-400 text-xs mt-1">{validationErrors.name}</p>
                     )}
                   </div>
                   <div>
                     <Label>Role</Label>
                     <Input 
                       type="text" 
                       value={editForm.role} 
                       onChange={e => setEditForm({...editForm, role: e.target.value})} 
                       className={validationErrors.role ? 'border-red-500' : ''}
                     />
                     {validationErrors.role && (
                       <p className="text-red-400 text-xs mt-1">{validationErrors.role}</p>
                     )}
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label>Age</Label>
                     <Input 
                       type="text" 
                       value={editForm.age} 
                       onChange={e => setEditForm({...editForm, age: e.target.value})} 
                       className={validationErrors.age ? 'border-red-500' : ''}
                     />
                     {validationErrors.age && (
                       <p className="text-red-400 text-xs mt-1">{validationErrors.age}</p>
                     )}
                   </div>
                   <div>
                     <Label>Height</Label>
                     <Input 
                       type="text" 
                       value={editForm.height} 
                       onChange={e => setEditForm({...editForm, height: e.target.value})} 
                       className={validationErrors.height ? 'border-red-500' : ''}
                     />
                     {validationErrors.height && (
                       <p className="text-red-400 text-xs mt-1">{validationErrors.height}</p>
                     )}
                   </div>
                </div>
                 <div>
                     <Label>Avatar URL</Label>
                     <div className="flex gap-2">
                       <Input 
                         type="text" 
                         value={editForm.avatarUrl} 
                         onChange={e => setEditForm({...editForm, avatarUrl: e.target.value})} 
                         className="flex-1"
                       />
                       <button
                         type="button"
                         onClick={() => {
                           setAssetPickerTarget('avatar');
                           setShowAssetPicker(true);
                         }}
                         className="px-3 py-2 bg-surface-dark hover:bg-white/10 border border-gray-700 rounded text-white text-sm font-medium transition-colors flex items-center gap-2"
                       >
                         <span className="material-symbols-outlined text-[18px]">photo_library</span>
                         Library
                       </button>
                     </div>
                     {editForm.avatarUrl && (
                       <div className="mt-2 w-20 h-20 rounded-lg bg-gray-800 bg-cover bg-center border border-gray-700" style={{ backgroundImage: `url('${editForm.avatarUrl}')` }}></div>
                     )}
                 </div>
                 <div>
                     <Label>Cover URL</Label>
                     <div className="flex gap-2">
                       <Input 
                         type="text" 
                         value={editForm.coverUrl} 
                         onChange={e => setEditForm({...editForm, coverUrl: e.target.value})} 
                         className="flex-1"
                       />
                       <button
                         type="button"
                         onClick={() => {
                           setAssetPickerTarget('cover');
                           setShowAssetPicker(true);
                         }}
                         className="px-3 py-2 bg-surface-dark hover:bg-white/10 border border-gray-700 rounded text-white text-sm font-medium transition-colors flex items-center gap-2"
                       >
                         <span className="material-symbols-outlined text-[18px]">photo_library</span>
                         Library
                       </button>
                     </div>
                     {editForm.coverUrl && (
                       <div className="mt-2 w-full h-24 rounded-lg bg-gray-800 bg-cover bg-center border border-gray-700" style={{ backgroundImage: `url('${editForm.coverUrl}')` }}></div>
                     )}
                 </div>
                 <div>
                     <Label>Description</Label>
                     <TextArea 
                       className={`h-24 ${validationErrors.description ? 'border-red-500' : ''}`} 
                       value={editForm.description} 
                       onChange={e => setEditForm({...editForm, description: e.target.value})} 
                     />
                     {validationErrors.description && (
                       <p className="text-red-400 text-xs mt-1">{validationErrors.description}</p>
                     )}
                 </div>
                 
                 <div>
                     <Label>Tags (comma separated)</Label>
                     <Input 
                       type="text" 
                       value={editForm.tags.join(', ')} 
                       onChange={e => setEditForm({...editForm, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0)})} 
                       placeholder="e.g. Protagonist, Student, Kind"
                     />
                 </div>

                 {/* Relationships Editor */}
                 <div className="pt-4 border-t border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                       <Label>Relationships</Label>
                       <button 
                         onClick={() => setEditForm({...editForm, relationships: [...editForm.relationships, { targetId: '', type: 'friend', desc: '' }]})}
                         className="text-xs text-primary hover:text-white"
                       >
                         + Add Relation
                       </button>
                    </div>
                    
                    <div className="space-y-3">
                       {editForm.relationships.map((rel, index) => (
                         <div key={index} className="flex flex-col gap-2 p-3 bg-black/20 rounded border border-gray-700/50">
                            <div className="flex gap-2">
                               <div className="flex-1">
                                  <label className="text-[10px] text-gray-500 uppercase">Target Character</label>
                                  <select
                                    className="w-full p-1.5 text-xs bg-surface-darker border border-gray-700 rounded text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                    value={rel.targetId}
                                    onChange={(e) => {
                                       const newRels = [...editForm.relationships];
                                       newRels[index] = { ...rel, targetId: e.target.value };
                                       setEditForm({ ...editForm, relationships: newRels });
                                    }}
                                  >
                                    <option value="">Select a character...</option>
                                    {characters.filter(c => c.id !== editForm.id).map(char => (
                                      <option key={char.id} value={char.id}>{char.name}</option>
                                    ))}
                                  </select>
                               </div>
                               <div className="flex-1">
                                  <label className="text-[10px] text-gray-500 uppercase">Type</label>
                                  <select
                                    className="w-full p-1.5 text-xs bg-surface-darker border border-gray-700 rounded text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                    value={rel.type}
                                    onChange={(e) => {
                                       const newRels = [...editForm.relationships];
                                       newRels[index] = { ...rel, type: e.target.value };
                                       setEditForm({ ...editForm, relationships: newRels });
                                    }}
                                  >
                                    <option value="friend">Friend</option>
                                    <option value="enemy">Enemy</option>
                                    <option value="rival">Rival</option>
                                    <option value="love">Love</option>
                                    <option value="family">Family</option>
                                    <option value="mentor">Mentor</option>
                                    <option value="student">Student</option>
                                    <option value="colleague">Colleague</option>
                                  </select>
                               </div>
                               <button 
                                 onClick={() => {
                                    const newRels = editForm.relationships.filter((_, i) => i !== index);
                                    setEditForm({ ...editForm, relationships: newRels });
                                 }}
                                 className="self-end p-1.5 text-gray-500 hover:text-red-400"
                               >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                               </button>
                            </div>
                            <div>
                               <label className="text-[10px] text-gray-500 uppercase">Description</label>
                               <Input 
                                 className="p-1.5 text-xs"
                                 placeholder="Relationship details..."
                                 value={rel.desc}
                                 onChange={(e) => {
                                    const newRels = [...editForm.relationships];
                                    newRels[index] = { ...rel, desc: e.target.value };
                                    setEditForm({ ...editForm, relationships: newRels });
                                 }}
                               />
                            </div>
                         </div>
                       ))}
                       {editForm.relationships.length === 0 && (
                          <div className="text-center text-xs text-gray-600 py-2">No relationships defined.</div>
                       )}
                    </div>
                 </div>
             </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Character"
        message="Are you sure you want to delete this character?"
        description="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      >
        {editForm && (
          <div className="flex items-center gap-3 p-3 bg-black/20 rounded border border-gray-700">
            <div className="size-12 rounded-full bg-gray-700 bg-cover bg-top shrink-0 flex items-center justify-center" 
                 style={{ backgroundImage: editForm.avatarUrl ? `url('${editForm.avatarUrl}')` : undefined }}>
              {!editForm.avatarUrl && <span className="material-symbols-outlined text-gray-500">person</span>}
            </div>
            <div>
              <div className="font-bold text-white">{editForm.name}</div>
              <div className="text-sm text-gray-400">{editForm.role}</div>
            </div>
          </div>
        )}
      </ConfirmDialog>

      {/* Asset Picker Modal */}
      <AssetPickerModal
        isOpen={showAssetPicker}
        onClose={() => setShowAssetPicker(false)}
        onSelect={handleAssetSelect}
        assets={assets}
        initialFilter={assetPickerTarget === 'avatar' ? 'sprite' : 'bg'}
        selectedUrl={assetPickerTarget === 'avatar' ? editForm?.avatarUrl : editForm?.coverUrl}
        title={assetPickerTarget === 'avatar' ? 'Select Avatar Image' : 'Select Cover Image'}
      />
    </div>
  );
};
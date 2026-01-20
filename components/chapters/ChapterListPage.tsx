import React, { useEffect, useState } from 'react';
import { BookOpen, MoreVertical, Plus, ChevronRight } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Chapter, SceneNode } from '../../types';
import { useNavigate } from 'react-router-dom';

export const ChapterListPage = () => {
  const db = useDatabase();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchChapters = async () => {
      setLoading(true);
      const data = await db.getChapters();
      setChapters(data);
      setLoading(false);
    };
    fetchChapters();
  }, [db]);

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) return;
    setAdding(true);
    // Generate UUID for chapter
    const newChapterId = `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newChapter: Chapter = {
      id: newChapterId,
      title: newChapterTitle,
      status: 'Draft',
      sceneCount: 0,
      lastEdited: 'Just now',
    };
    try {
      await db.saveChapter(newChapter);
      
      // 空の始点ノードを作成
      const startNodeId = `${Date.now()}_start`;
      const startNode: SceneNode = {
        id: startNodeId,
        title: 'Start',
        type: 'start',
        chapterId: newChapterId,
        summary: 'Opening scene',
        script: '',
      };
      await db.createNode(startNode);
      
      setChapters(prev => [...prev, newChapter]);
      setIsModalOpen(false);
      setNewChapterTitle('');
      
      // エディター画面に直接遷移
      navigate(`/editor/${newChapterId}`);
    } catch (e) {
      alert('Failed to add chapter');
    } finally {
      setAdding(false);
    }
  };

  const handleSelectChapter = async (chapterId: string) => {
    // エディター画面に遷移(チャプターを指定)
    navigate(`/editor/${chapterId}`);
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark overflow-y-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Chapters</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage the story structure and progression.</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold shadow-lg shadow-primary/20 transition-all"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={20} />
          <span>New Chapter</span>
        </button>
            {/* 新規チャプターモーダル */}
            {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white dark:bg-surface-dark rounded-xl p-8 shadow-xl w-full max-w-md">
                  <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Add New Chapter</h2>
                  <input
                    type="text"
                    className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-white mb-4 focus:border-primary outline-none"
                    placeholder="Chapter Title"
                    value={newChapterTitle}
                    onChange={e => setNewChapterTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddChapter()}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      className="px-4 py-2 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      onClick={() => { setIsModalOpen(false); setNewChapterTitle(''); }}
                      disabled={adding}
                    >Cancel</button>
                    <button
                      className="px-6 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-colors"
                      onClick={handleAddChapter}
                      disabled={adding || !newChapterTitle.trim()}
                    >Add</button>
                  </div>
                </div>
              </div>
            )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 max-w-5xl">
          {chapters.map((chapter) => (
            <div 
              key={chapter.id}
              onClick={() => handleSelectChapter(chapter.id)}
              className="group flex items-center justify-between bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-xl p-6 cursor-pointer hover:border-primary hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shadow-inner">
                  <BookOpen size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                      {chapter.title}
                    </h3>
                    <StatusBadge status={chapter.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">movie</span> {chapter.sceneCount} Scenes</span>
                      <span>•</span>
                      <span>Last edited {chapter.lastEdited}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-bold text-sm flex items-center gap-1">
                    Open Chapter <ChevronRight size={16} />
                </div>
                <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full z-10" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical size={20} />
                </button>
              </div>
            </div>
          ))}
          
          <div className="border-2 border-dashed border-gray-200 dark:border-white/5 rounded-xl p-6 flex items-center justify-center text-gray-400">
            <span className="text-sm">End of list</span>
          </div>
        </div>
      )}
    </div>
  );
};
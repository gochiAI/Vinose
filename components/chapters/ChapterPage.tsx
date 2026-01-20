import React, { useState } from 'react';
import { SceneNode } from '../../types';
import { FileText, ArrowRight } from 'lucide-react';
import { useDatabase } from '../../contexts/DatabaseContext';

interface ChapterPageProps {
  chapterTitle: string;
  nodes: SceneNode[];
  onSelectNode: (id: string) => void;
}

export const ChapterPage = ({ chapterTitle, nodes, onSelectNode }: ChapterPageProps) => {
  const db = useDatabase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSceneTitle, setNewSceneTitle] = useState('');
  const [newSceneType, setNewSceneType] = useState<'start' | 'choice' | 'scene' | 'end'>('scene');
  const [adding, setAdding] = useState(false);

  const handleAddScene = async () => {
    if (!newSceneTitle.trim()) return;
    setAdding(true);
    const newNode: SceneNode = {
      id: Date.now().toString(),
      title: newSceneTitle,
      type: newSceneType,
      chapterId: chapterTitle,
      summary: '',
      script: '',
    };
    try {
      await db.createNode(newNode);
      setIsModalOpen(false);
      setNewSceneTitle('');
      setNewSceneType('scene');
      // リロードして最新のノードを取得
      window.location.reload();
    } catch (e) {
      alert('Failed to add scene');
    } finally {
      setAdding(false);
    }
  };
  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark overflow-y-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{chapterTitle}</h1>
        <p className="text-gray-500 dark:text-gray-400">Total Scenes: {nodes.length} • Last Edited: Just now</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nodes.map((node) => (
          <div 
            key={node.id}
            onClick={() => onSelectNode(node.id)}
            className="group bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-xl p-6 cursor-pointer hover:border-primary hover:shadow-lg transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FileText size={64} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-black/10 dark:bg-white/10 ${node.type === 'choice' ? 'text-yellow-500' : 'text-primary'}`}>
                  {node.type}
                </span>
                <span className="text-xs text-gray-500 font-mono">ID: {node.id}</span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                {node.title}
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                {node.summary || "No summary provided."}
              </p>

              <div className="flex items-center text-primary font-bold text-sm gap-1 group-hover:gap-2 transition-all">
                Edit Scene <ArrowRight size={16} />
              </div>
            </div>
          </div>
        ))}

        {/* Add New Placeholder */}
        <div 
          className="border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5 cursor-pointer transition-all min-h-[200px]"
          onClick={() => setIsModalOpen(true)}
        >
           <span className="material-symbols-outlined text-4xl mb-2">add_circle</span>
           <span className="font-bold">Create New Scene</span>
        </div>
      </div>

      {/* 新規シーンモーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-surface-dark rounded-xl p-8 shadow-xl w-full max-w-md">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Add New Scene</h2>
            <input
              type="text"
              className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-white mb-4 focus:border-primary outline-none"
              placeholder="Scene Title"
              value={newSceneTitle}
              onChange={e => setNewSceneTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddScene()}
              autoFocus
            />
            <select
              className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-white mb-4 focus:border-primary outline-none"
              value={newSceneType}
              onChange={e => setNewSceneType(e.target.value as any)}
            >
              <option value="start">Start</option>
              <option value="scene">Scene</option>
              <option value="choice">Choice</option>
              <option value="end">End</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                onClick={() => { setIsModalOpen(false); setNewSceneTitle(''); }}
                disabled={adding}
              >Cancel</button>
              <button
                className="px-6 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-colors"
                onClick={handleAddScene}
                disabled={adding || !newSceneTitle.trim()}
              >Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
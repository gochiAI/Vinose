import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { FileItem } from '../../types';
import { EditorToolbar } from './EditorToolbar';
import './DocumentEditor.css';

interface DocumentEditorProps {
  file: FileItem;
  onSave: (id: string, newContent: string, newName: string) => void;
  onClose: () => void;
}

export const DocumentEditor = ({ file, onSave, onClose }: DocumentEditorProps) => {
  const [name, setName] = useState(file.name);
  const [isDirty, setIsDirty] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Start typing...',
      }),
    ],
    content: typeof file.content === 'string' ? file.content : '',
    onUpdate: () => setIsDirty(true),
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none',
      },
    },
  });

  // 自動保存処理などはそのまま維持
  useEffect(() => {
    if (!isDirty || !editor) return;
    const timeoutId = setTimeout(() => handleSave(), 2000);
    return () => clearTimeout(timeoutId);
  }, [isDirty, name]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, name, isDirty]);

  useEffect(() => {
    return () => { editor?.destroy(); };
  }, [editor]);

  const handleSave = () => {
    if (!editor) return;
    onSave(file.id, editor.getHTML(), name);
    setIsDirty(false);
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1A1A1A] animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-white/5 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          
          <input 
            type="text" 
            value={name}
            onChange={(e) => { setName(e.target.value); setIsDirty(true); }}
            className="font-semibold text-base text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 p-0 hover:underline decoration-dashed decoration-gray-400 cursor-text"
          />
          
          {isDirty && <span className="text-xs text-gray-400 italic ml-2">•</span>}
        </div>

        <button 
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium text-sm transition-all ${
             isDirty 
               ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
               : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300'
          }`}
        >
          <Save size={16} />
          {isDirty ? 'Save' : 'Saved'}
        </button>
      </div>

      {/* Editor Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor Surface */}
      <div className="flex-1 overflow-y-auto p-8 flex justify-center cursor-text" onClick={() => editor.chain().focus().run()}>
        <div className="w-full max-w-[816px] min-h-[1056px] bg-white dark:bg-[#1E1E1E] shadow-lg border border-gray-200 dark:border-black/50 p-12 md:p-[96px]">
          <EditorContent 
            editor={editor} 
            className="tiptap-editor w-full h-full text-gray-900 dark:text-gray-200 font-serif text-lg leading-relaxed outline-none"
          />
        </div>
      </div>
    </div>
  );
};
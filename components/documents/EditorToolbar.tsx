import React from 'react';
import { Editor } from '@tiptap/react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type, List, Heading1, Heading2 } from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
}

export const EditorToolbar = ({ editor }: EditorToolbarProps) => {
  if (!editor) return null;

  const Button = ({ onClick, isActive, children }: { onClick: () => void; isActive?: boolean; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors ${
        isActive ? 'bg-gray-200 dark:bg-white/20 text-black dark:text-white' : ''
      }`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-4 bg-gray-300 dark:bg-white/20 mx-1" />;

  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-[#EDF2FA] dark:bg-[#252525] border-b border-gray-200 dark:border-white/5 overflow-x-auto shrink-0 sticky top-[57px] z-10">
      <div className="flex bg-white dark:bg-white/5 rounded-full px-2 py-1 shadow-sm border border-gray-200 dark:border-white/5 items-center gap-1">
        {/* Headings */}
        <Button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
        >
          <Heading1 size={16} />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 size={16} />
        </Button>

        <Divider />

        {/* Formatting */}
        <Button onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}>
          <Bold size={16} />
        </Button>
        <Button onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}>
          <Italic size={16} />
        </Button>
        <Button onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}>
          <Underline size={16} />
        </Button>

        <Divider />

        {/* Alignment */}
        <Button onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })}>
          <AlignLeft size={16} />
        </Button>
        <Button onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })}>
          <AlignCenter size={16} />
        </Button>
        <Button onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })}>
          <AlignRight size={16} />
        </Button>

        <Divider />

        {/* Lists */}
        <Button onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}>
          <List size={16} />
        </Button>
      </div>
    </div>
  );
};
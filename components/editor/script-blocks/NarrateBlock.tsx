import React from 'react';
import { AlignLeft } from 'lucide-react';

interface NarrateBlockProps {
  content: {
    text: string;
  };
  onChange: (content: any) => void;
}

export const NarrateBlock = ({ content, onChange }: NarrateBlockProps) => {
  return (
    <div className="p-4 bg-surface-dark/50 rounded-xl border border-gray-800 border-dashed hover:border-gray-600 transition-colors">
      <div className="flex items-center gap-2 mb-2 text-gray-500 text-xs font-bold uppercase tracking-wider">
          <AlignLeft size={14} /> Narration
      </div>
      <textarea 
          className="w-full bg-transparent text-gray-400 p-0 border-none focus:ring-0 outline-none resize-none text-sm italic"
          placeholder="Scene description or action..."
          value={content.text}
          onChange={(e) => onChange({ ...content, text: e.target.value })}
          rows={2}
      />
    </div>
  );
};
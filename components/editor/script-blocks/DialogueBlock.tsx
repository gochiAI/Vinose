import React from 'react';
import { MessageSquare } from 'lucide-react';
import { initialCharacters } from '../../../data';

interface DialogueBlockProps {
  content: {
    character: string;
    text: string;
  };
  onChange: (content: any) => void;
}

export const DialogueBlock = ({ content, onChange }: DialogueBlockProps) => {
  const char = initialCharacters.find(c => c.name === content.character);
  
  return (
    <div className="flex gap-4 p-4 bg-surface-dark rounded-xl border border-gray-700/50 group hover:border-gray-600 transition-colors shadow-sm">
      <div className="flex flex-col gap-2 shrink-0 w-32">
         <div className="size-16 rounded-full bg-gray-700 bg-cover bg-top self-center border-2 border-gray-600 shadow-lg relative" 
              style={{ backgroundImage: char?.avatarUrl ? `url('${char.avatarUrl}')` : undefined }}>
             {!char?.avatarUrl && <span className="material-symbols-outlined text-gray-500 text-3xl flex items-center justify-center h-full">person</span>}
             <div className="absolute -bottom-1 -right-1 bg-surface-darker rounded-full p-0.5 border border-gray-600">
                <MessageSquare size={12} className="text-blue-400" />
             </div>
         </div>
         <select 
           className="w-full bg-surface-darker text-white text-xs p-1.5 rounded border border-gray-700 outline-none focus:border-primary"
           value={content.character}
           onChange={(e) => onChange({ ...content, character: e.target.value })}
         >
           {initialCharacters.map(c => (
             <option key={c.id} value={c.name}>{c.name}</option>
           ))}
           <option value="UNKNOWN">Unknown</option>
         </select>
      </div>
      <div className="flex-1 relative">
         <div className="absolute -left-2 top-6 w-2 h-2 bg-surface-darker border-l border-b border-gray-700 transform rotate-45"></div>
         <textarea 
           className="w-full h-full min-h-[80px] bg-surface-darker text-gray-200 p-3 rounded-lg border border-gray-700 focus:border-primary outline-none resize-none text-sm leading-relaxed"
           placeholder="Enter dialogue..."
           value={content.text}
           onChange={(e) => onChange({ ...content, text: e.target.value })}
         />
      </div>
    </div>
  );
};
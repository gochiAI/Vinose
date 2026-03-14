import React, { useState } from 'react';
import { SceneNode } from '../../types';

interface InspectorProps {
  node: SceneNode;
  onUpdate: (updates: Partial<SceneNode>) => void;
  onClose: () => void;
}

export const Inspector = ({ node, onUpdate, onClose }: InspectorProps) => {
  const [newFlagName, setNewFlagName] = useState('');
  const [isAddingFlag, setIsAddingFlag] = useState(false);

  if (!node) {
    return null;
  }

  const handleAddFlag = () => {
    if (newFlagName.trim()) {
      const currentFlags = node.flags || [];
      if (!currentFlags.includes(newFlagName)) {
        onUpdate({ flags: [...currentFlags, newFlagName] });
      }
      setNewFlagName('');
      setIsAddingFlag(false);
    }
  };

  const handleRemoveFlag = (flag: string) => {
    const currentFlags = node.flags || [];
    onUpdate({ flags: currentFlags.filter(f => f !== flag) });
  };

  return (
    <div className="w-[20%] bg-surface-darker flex flex-col border-l border-border-dark overflow-y-auto">
      <div className="p-4 border-b border-border-dark flex items-center justify-between sticky top-0 bg-surface-darker z-10">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Node Properties</h2>
        <span 
          onClick={onClose}
          className="material-symbols-outlined text-gray-600 text-[18px] cursor-pointer hover:text-white"
          title="Close Properties"
        >
          more_vert
        </span>
      </div>
      
      <div className="p-4 flex flex-col gap-6">
        {/* Scene Info */}
        <div className="flex flex-col gap-3">
          <label className="text-xs text-gray-500 font-medium">Scene Title</label>
          <input 
            className="w-full bg-surface-dark border border-gray-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" 
            type="text" 
            value={node.title} 
            onChange={(e) => onUpdate({ title: e.target.value })}
          />
          
          <label className="text-xs text-gray-500 font-medium mt-1">Summary</label>
          <textarea 
            className="w-full bg-surface-dark border border-gray-700 rounded p-2 text-sm text-gray-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all resize-none" 
            rows={3} 
            value={node.summary || ''}
            onChange={(e) => onUpdate({ summary: e.target.value })}
          ></textarea>
        </div>

        {/* Logic */}
        <div className="mt-4 p-3 rounded bg-blue-900/10 border border-blue-900/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-blue-400 text-[16px]">flag</span>
            <span className="text-xs font-bold text-blue-400 uppercase">Logic Flags</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Array.isArray(node.flags) ? node.flags : []).map(flag => (
              <span key={flag} className="group px-2 py-1 rounded bg-blue-500/10 text-blue-300 text-[10px] border border-blue-500/20 flex items-center gap-1">
                {flag}
                <button onClick={() => handleRemoveFlag(flag)} className="hidden group-hover:block hover:text-white">
                  &times;
                </button>
              </span>
            ))}
            {!isAddingFlag ? (
               <button 
                 onClick={() => setIsAddingFlag(true)}
                 className="px-2 py-1 rounded border border-dashed border-blue-500/30 text-blue-400 hover:text-blue-200 text-[10px]"
               >
                  + Add
               </button>
            ) : (
               <div className="flex items-center gap-1 w-full mt-2">
                  <input 
                    autoFocus
                    type="text" 
                    className="flex-1 bg-surface-dark border border-gray-600 rounded px-1.5 py-0.5 text-[10px] text-white"
                    placeholder="Flag Name"
                    value={newFlagName}
                    onChange={e => setNewFlagName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddFlag()}
                  />
                  <button onClick={handleAddFlag} className="text-blue-400 hover:text-white"><span className="material-symbols-outlined text-[14px]">check</span></button>
                  <button onClick={() => setIsAddingFlag(false)} className="text-gray-500 hover:text-white"><span className="material-symbols-outlined text-[14px]">close</span></button>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
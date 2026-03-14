import React from 'react';
import { GitFork, Zap } from 'lucide-react';
import { SceneNode } from '../../types';

interface ChoiceBlockProps {
  content: {
    options: Array<{
      type: 'user' | 'condition';
      text: string;
      target: string;
    }>;
  };
  onChange: (content: any) => void;
  allNodes: SceneNode[];
  currentNodeId: string;
}

export const ChoiceBlock = ({ content, onChange, allNodes, currentNodeId }: ChoiceBlockProps) => {
  return (
    <div className="p-4 bg-yellow-900/10 rounded-xl border border-yellow-700/30">
       <div className="flex items-center gap-2 mb-3 text-yellow-500 text-xs font-bold uppercase tracking-wider">
          <GitFork size={14} /> Branching Logic
       </div>
       <div className="space-y-3">
          {content.options.map((opt, i) => (
             <div key={i} className="flex flex-col gap-2 bg-surface-darker/50 p-2 rounded border border-yellow-900/20">
                <div className="flex items-center gap-2">
                    <select 
                      className="bg-surface-dark text-[10px] text-gray-400 border border-gray-700 rounded p-1"
                      value={opt.type}
                      onChange={(e) => {
                          const newOpts = [...content.options];
                          newOpts[i] = { ...newOpts[i], type: e.target.value as any };
                          onChange({ ...content, options: newOpts });
                      }}
                    >
                       <option value="user">User Choice</option>
                       <option value="condition">Condition (Variable)</option>
                    </select>
                    <div className="flex-1"></div>
                    <button 
                      onClick={() => {
                        const newOpts = content.options.filter((_, idx) => idx !== i);
                        onChange({ ...content, options: newOpts });
                      }}
                      className="text-yellow-700 hover:text-red-400"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {opt.type === 'user' ? (
                        <input 
                          type="text" 
                          className="flex-1 bg-surface-dark border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-yellow-500 outline-none"
                          placeholder="Choice Label..."
                          value={opt.text}
                          onChange={(e) => {
                              const newOpts = [...content.options];
                              newOpts[i] = { ...newOpts[i], text: e.target.value };
                              onChange({ ...content, options: newOpts });
                          }}
                        />
                    ) : (
                        <div className="flex-1 flex items-center gap-2 bg-blue-900/20 border border-blue-500/30 rounded px-2 py-1.5">
                           <Zap size={14} className="text-blue-400" />
                           <input 
                              type="text" 
                              className="flex-1 bg-transparent border-none p-0 text-sm text-blue-100 placeholder-blue-500/50 focus:ring-0"
                              placeholder="e.g. trust > 10"
                              value={opt.text}
                              onChange={(e) => {
                                  const newOpts = [...content.options];
                                  newOpts[i] = { ...newOpts[i], text: e.target.value };
                                  onChange({ ...content, options: newOpts });
                              }}
                            />
                        </div>
                    )}
                    <span className="text-gray-500">→</span>
                    <select
                      className="w-32 bg-surface-dark border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-300 focus:border-yellow-500 outline-none"
                      value={opt.target}
                      onChange={(e) => {
                          const newOpts = [...content.options];
                          newOpts[i] = { ...newOpts[i], target: e.target.value };
                          onChange({ ...content, options: newOpts });
                      }}
                    >
                       <option value="">(End)</option>
                       {allNodes.filter(n => n.id !== currentNodeId).map(n => (
                         <option key={n.id} value={n.id}>{n.title}</option>
                       ))}
                    </select>
                </div>
             </div>
          ))}
          <button 
            onClick={() => onChange({ ...content, options: [...content.options, {type: 'user', text: '', target: ''}] })}
            className="text-xs text-yellow-500 hover:text-yellow-300 font-bold flex items-center gap-1 mt-2"
          >
             <span className="material-symbols-outlined text-[14px]">add</span> Add Branch
          </button>
       </div>
    </div>
  );
};
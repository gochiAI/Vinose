import React from 'react';
import { ArrowRightCircle } from 'lucide-react';
import { SceneNode } from '../../../types';

interface TransitionBlockProps {
  content: {
    targetNodeId: string;
  };
  onChange: (content: any) => void;
  allNodes: SceneNode[];
  currentNodeId: string;
}

export const TransitionBlock = ({ content, onChange, allNodes, currentNodeId }: TransitionBlockProps) => {
  return (
    <div className="p-3 bg-red-900/20 rounded-lg border border-red-500/30 flex items-center gap-4">
       <div className="p-2 bg-red-500/20 rounded text-red-300">
          <ArrowRightCircle size={20} />
       </div>
       <div className="flex-1">
          <label className="text-[10px] text-red-300 font-bold uppercase tracking-wider">Move Scene</label>
          <select
             className="w-full bg-surface-darker/50 rounded text-white text-sm border border-red-900/50 p-2 focus:ring-0 font-medium"
             value={content.targetNodeId}
             onChange={(e) => onChange({ ...content, targetNodeId: e.target.value })}
          >
             <option value="">(Select Target Scene)</option>
             {allNodes.filter(n => n.id !== currentNodeId).map(n => (
               <option key={n.id} value={n.id}>{n.title} (ID: {n.id})</option>
             ))}
          </select>
       </div>
    </div>
  );
};
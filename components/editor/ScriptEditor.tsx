import React, { useState, useEffect } from 'react';
import { SceneNode, Block, ExtendedCharacter, Asset } from '../../types';
import { MessageSquare, AlignLeft, GitFork, Trash2, GripVertical, ArrowRightCircle, MonitorPlay } from 'lucide-react';

import { DialogueBlock } from './script-blocks/DialogueBlock';
import { NarrateBlock } from './script-blocks/NarrateBlock';
import { MediaBlock } from './script-blocks/MediaBlock';
import { TransitionBlock } from './script-blocks/TransitionBlock';
import { ChoiceBlock } from './script-blocks/ChoiceBlock';

interface ScriptEditorProps {
  node?: SceneNode;
  allNodes: SceneNode[]; // Need access to other nodes for linking
  onUpdate: (blocks: Block[]) => void;
  onClose: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
  characters: ExtendedCharacter[];
  assets: Asset[];
}

export const ScriptEditor = ({ node, allNodes, onUpdate, onClose, isFullscreen, onToggleFullscreen, isInspectorOpen, onToggleInspector, characters, assets }: ScriptEditorProps) => {
  if (!node) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const [blocks, setBlocks] = useState<Block[]>(Array.isArray(node.script) ? node.script : []);

  useEffect(() => {
    setBlocks(Array.isArray(node.script) ? node.script : []);
  }, [node.id, node.script]);

  const updateBlocks = (newBlocks: Block[]) => {
    setBlocks(newBlocks);
    onUpdate(newBlocks);
  };

  type BlockType = Block['type'];

  const addBlock = (type: BlockType) => {
    const id = Date.now().toString();
    const newBlock: Block =
      type === 'dialogue'
        ? { id, type, content: { characterId: characters[0]?.id || '', text: '' } }
        : type === 'narrate'
          ? { id, type, content: { text: '' } }
          : type === 'media'
            ? { id, type, content: { assetId: '', category: 'background' } }
            : type === 'choice'
              ? { id, type, content: { options: [{ type: 'user', text: '', target: '' }] } }
              : { id, type: 'move', content: { targetNodeId: '' } };

    updateBlocks([...blocks, newBlock]);
  };

  const deleteBlock = (index: number) => {
    const newBlocks = [...blocks];
    newBlocks.splice(index, 1);
    updateBlocks(newBlocks);
  };

  const updateBlockContent = (index: number, content: any) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], content } as Block;
    updateBlocks(newBlocks);
  };

  return (
    <div className={`${isFullscreen ? 'w-full absolute inset-0 z-30' : 'w-[45%] flex-1'} bg-[#1E1E1E] border-l border-r border-border-dark flex flex-col relative animate-in slide-in-from-right-10 duration-200 transition-all`}>
      {/* Visual Editor Toolbar - 2 Row Layout */}
      <div className="border-b border-border-dark flex flex-col sm:flex-row items-start sm:items-center px-4 py-2 justify-between bg-[#1E1E1E] shrink-0 gap-4">
        <div className="grid grid-cols-3 gap-1 bg-black/20 p-1 rounded-lg w-full sm:w-auto">
          <button 
            onClick={() => addBlock('dialogue')}
            className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-md hover:bg-primary/20 text-gray-300 hover:text-primary transition-colors border border-transparent hover:border-primary/30 group" 
          >
            <MessageSquare size={16} className="text-blue-400 group-hover:text-primary" />
            <span className="text-xs font-bold">Dialogue</span>
          </button>

          <button 
            onClick={() => addBlock('narrate')}
            className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/5 text-gray-300 hover:text-white transition-colors border border-transparent hover:border-white/10" 
          >
            <AlignLeft size={16} className="text-gray-400" />
            <span className="text-xs font-bold">Narrate</span>
          </button>
          
          <button 
             onClick={() => addBlock('media')}
             className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-md hover:bg-green-500/20 text-gray-300 hover:text-green-300 transition-colors border border-transparent hover:border-green-500/30"
          >
            <MonitorPlay size={16} className="text-green-500" />
            <span className="text-xs font-bold">Asset</span>
          </button>

          <button 
             onClick={() => addBlock('choice')}
             className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-md hover:bg-yellow-500/20 text-gray-300 hover:text-yellow-300 transition-colors border border-transparent hover:border-yellow-500/30"
          >
            <GitFork size={16} className="text-yellow-500" />
            <span className="text-xs font-bold">Choice</span>
          </button>

           <button 
             onClick={() => addBlock('move')}
             className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-md hover:bg-red-500/20 text-gray-300 hover:text-red-300 transition-colors border border-transparent hover:border-red-500/30"
          >
            <ArrowRightCircle size={16} className="text-red-500" />
            <span className="text-xs font-bold">Move</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-center">
           {!isInspectorOpen && (
             <button 
                 onClick={onToggleInspector}
                 className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                 title="Open Properties"
             >
                 <span className="material-symbols-outlined text-[20px]">dock_to_left</span>
             </button>
           )}
           {!isFullscreen && (
            <button 
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                title="Close Editor"
            >
                <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
           )}
        </div>
      </div>

      {/* Blocks Surface */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-20 scroll-smooth">
         {blocks.length === 0 && (
            <div className="text-center text-gray-600 mt-20">
               <p className="text-sm">No content yet.</p>
               <p className="text-xs mt-2">Add a block from the toolbar to start writing.</p>
            </div>
         )}
         {blocks.map((block, i) => (
            <div key={block.id} className="relative group/block pl-6">
               {/* Hover Actions */}
               <div className="absolute left-0 top-2 opacity-0 group-hover/block:opacity-100 transition-opacity flex flex-col items-center gap-1">
                  <span className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400"><GripVertical size={16} /></span>
                  <button onClick={() => deleteBlock(i)} className="text-gray-600 hover:text-red-400 p-1"><Trash2 size={14} /></button>
               </div>
               
              {block.type === 'dialogue' && <DialogueBlock content={block.content} onChange={(c) => updateBlockContent(i, c)} characters={characters} />}
              {block.type === 'narrate' && <NarrateBlock content={block.content} onChange={(c) => updateBlockContent(i, c)} />}
              {block.type === 'media' && <MediaBlock content={block.content} onChange={(c) => updateBlockContent(i, c)} assets={assets} />}
              {block.type === 'move' && <TransitionBlock content={block.content} onChange={(c) => updateBlockContent(i, c)} allNodes={allNodes} currentNodeId={node.id} />}
              {block.type === 'choice' && <ChoiceBlock content={block.content} onChange={(c) => updateBlockContent(i, c)} allNodes={allNodes} currentNodeId={node.id} />}
            </div>
         ))}
      </div>

      {/* Focus Toggle Overlay Button */}
      <button 
        onClick={onToggleFullscreen}
        className={`absolute bottom-6 right-6 p-3 rounded-full bg-surface-darker border border-gray-700 shadow-xl text-gray-400 hover:text-white hover:border-primary transition-all z-20 group ${isFullscreen ? 'bg-primary text-white border-primary' : ''}`} 
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
      >
        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
            {isFullscreen ? 'close_fullscreen' : 'fullscreen'}
        </span>
      </button>
    </div>
  );
};
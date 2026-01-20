import React, { useState, useRef, useMemo } from 'react';
import { SceneNode } from '../../types';

interface FlowCanvasProps {
  nodes: SceneNode[];
  selectedNodeId: string;
  onNodeSelect: (id: string) => void;
  onAddNode: () => void;
  layoutMode: 'split' | 'fullscreen_script' | 'fullscreen_flow';
  onToggleLayout: () => void;
  onOpenScript: () => void;
}

// Visual Constants
const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;
const COLUMN_GAP = 100;
const ROW_GAP = 60;

// Internal type for layout calculation
interface LayoutNode extends SceneNode {
  _x: number;
  _y: number;
}

export const FlowCanvas = ({ nodes, selectedNodeId, onNodeSelect, onAddNode, layoutMode, onToggleLayout, onOpenScript }: FlowCanvasProps) => {
  const [transform, setTransform] = useState({ x: 50, y: 100, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // --- Auto-Layout Algorithm (Left-to-Right Layered) ---
  const { layoutNodes, edges } = useMemo(() => {
    // 1. Organize nodes by ID for O(1) access
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    // 2. Determine "Layers" (Depth from start)
    // Simple BFS to assign X coordinates (columns)
    const layers: Record<number, string[]> = {};
    const visited = new Set<string>();
    const nodeDepth: Record<string, number> = {};
    
    const queue: { id: string, depth: number }[] = [];
    
    // Find start nodes (nodes with no incoming connections, or just type='start')
    // For robustness, if no 'start' type, pick the first one.
    const startNode = nodes.find(n => n.type === 'start') || nodes[0];
    if (startNode) {
      queue.push({ id: startNode.id, depth: 0 });
      visited.add(startNode.id);
    }

    // Process queue
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      nodeDepth[id] = depth;
      
      if (!layers[depth]) layers[depth] = [];
      layers[depth].push(id);

      const node = nodeMap.get(id);
      if (node && node.nextIds) {
        node.nextIds.forEach(nextId => {
          if (!visited.has(nextId)) {
            visited.add(nextId);
            queue.push({ id: nextId, depth: depth + 1 });
          }
        });
      }
    }

    // Handle disconnected nodes (orphan nodes) - put them in layer 0 or separate
    nodes.forEach(n => {
      if (!visited.has(n.id)) {
        // Place orphans at layer 0 below others
        const depth = 0;
        if (!layers[depth]) layers[depth] = [];
        layers[depth].push(n.id);
      }
    });

    // 3. Assign Coordinates
    const computedNodes: LayoutNode[] = [];
    const computedEdges: { startX: number; startY: number; endX: number; endY: number; id: string }[] = [];

    // Calculate positions
    Object.keys(layers).forEach(depthKey => {
      const depth = parseInt(depthKey);
      const layerNodeIds = layers[depth];
      
      layerNodeIds.forEach((id, index) => {
        const node = nodeMap.get(id)!;
        
        // Calculate X: Depth * (Width + Gap)
        const x = depth * (NODE_WIDTH + COLUMN_GAP);
        
        // Calculate Y: Index * (Height + Gap)
        // Center the group vertically relative to 0
        const totalHeight = layerNodeIds.length * (NODE_HEIGHT + ROW_GAP) - ROW_GAP;
        const startY = -totalHeight / 2;
        const y = startY + index * (NODE_HEIGHT + ROW_GAP);

        computedNodes.push({ ...node, _x: x, _y: y });
      });
    });

    // 4. Generate Edges
    computedNodes.forEach(source => {
      if (source.nextIds) {
        source.nextIds.forEach(targetId => {
          const target = computedNodes.find(n => n.id === targetId);
          if (target) {
            computedEdges.push({
              id: `${source.id}-${target.id}`,
              startX: source._x + NODE_WIDTH, // Right side of source
              startY: source._y + NODE_HEIGHT / 2, // Middle of source
              endX: target._x, // Left side of target
              endY: target._y + NODE_HEIGHT / 2 // Middle of target
            });
          }
        });
      }
    });

    return { layoutNodes: computedNodes, edges: computedEdges };
  }, [nodes]);


  // --- Event Handlers for Panning ---

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking background
    if ((e.target as HTMLElement).closest('.node-element')) return;
    
    setIsPanning(true);
    dragStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setTransform({
        ...transform,
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleZoom = (delta: number) => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(Math.max(0.1, prev.scale + delta), 2)
    }));
  };

  const handleReset = () => {
    setTransform({ x: 50, y: 100, scale: 1 });
  };

  return (
    <div 
      className={`w-full h-full bg-surface-darker bg-dot-pattern relative overflow-hidden group/canvas transition-all duration-300 ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`} 
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Canvas Controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
        <div className="flex flex-col bg-surface-dark border border-border-dark rounded-lg shadow-xl overflow-hidden">
          <button onClick={() => handleZoom(0.1)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 border-b border-border-dark"><span className="material-symbols-outlined text-[20px]">add</span></button>
          <button onClick={() => handleZoom(-0.1)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 border-b border-border-dark"><span className="material-symbols-outlined text-[20px]">remove</span></button>
          <button onClick={handleReset} className="p-2 text-gray-400 hover:text-white hover:bg-white/5"><span className="material-symbols-outlined text-[20px]">center_focus_strong</span></button>
        </div>
        <button onClick={onAddNode} className="p-2 bg-primary text-white rounded-lg shadow-lg hover:bg-primary-hover transition-colors" title="Add Node">
          <span className="material-symbols-outlined text-[24px]">add</span>
        </button>
      </div>

      {/* View Mode Toggles */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
         {layoutMode === 'fullscreen_flow' && (
            <button onClick={onOpenScript} className="flex items-center gap-2 bg-surface-dark border border-primary text-primary hover:bg-primary/10 px-4 py-2 rounded-lg shadow-lg transition-all animate-in fade-in">
              <span className="material-symbols-outlined">edit_note</span>
              <span className="font-bold text-sm">Open Script</span>
            </button>
         )}
         <button onClick={onToggleLayout} className="self-end p-2 rounded-full bg-surface-darker border border-gray-700 shadow-xl text-gray-400 hover:text-white hover:border-primary transition-all">
           <span className="material-symbols-outlined">{layoutMode === 'fullscreen_flow' ? 'close_fullscreen' : 'fullscreen'}</span>
         </button>
      </div>

      {/* Transform Container */}
      <div 
        className="w-full h-full origin-top-left transition-transform duration-75 ease-out"
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
      >
        {/* Edges Layer */}
        <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none z-0 overflow-visible">
          {edges.map(edge => {
             const dx = Math.abs(edge.endX - edge.startX) / 2;
             return (
               <path 
                key={edge.id}
                d={`M ${edge.startX} ${edge.startY} C ${edge.startX + dx} ${edge.startY}, ${edge.endX - dx} ${edge.endY}, ${edge.endX} ${edge.endY}`} 
                fill="none" 
                stroke="#2a3637" 
                strokeWidth="2"
               />
             );
          })}
        </svg>

        {/* Nodes Layer */}
        {layoutNodes.map(node => {
          const isSelected = selectedNodeId === node.id;
          let borderColor = 'border-border-dark';
          if (isSelected) borderColor = 'border-primary ring-2 ring-primary/20';
          else if (node.type === 'choice') borderColor = 'border-yellow-700/50';

          return (
            <div 
              key={node.id}
              onClick={(e) => { e.stopPropagation(); onNodeSelect(node.id); }}
              style={{ left: node._x, top: node._y, width: NODE_WIDTH, height: NODE_HEIGHT }}
              className={`node-element absolute bg-surface-dark border ${borderColor} rounded-lg p-3 shadow-lg cursor-pointer transition-all z-10 hover:scale-[1.02] hover:shadow-xl ${isSelected ? 'shadow-2xl shadow-primary/10 z-20' : 'opacity-90 hover:opacity-100'}`}
            >
              {/* Node Header */}
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isSelected ? 'text-primary' : (node.type === 'choice' ? 'text-yellow-600' : 'text-gray-500')}`}>
                  {node.type === 'choice' && <span className="material-symbols-outlined text-[12px]">call_split</span>}
                  {isSelected ? 'Active' : node.type}
                </span>
              </div>
              
              {/* Content */}
              <div className={`font-bold text-sm mb-1 truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>{node.title}</div>
              <p className="text-[10px] text-gray-500 leading-tight line-clamp-2">{node.summary || 'No summary'}</p>
              
              {/* Connection Ports (Visual) */}
              <div className={`absolute -left-1 top-1/2 -translate-y-1/2 size-2 rounded-full ${isSelected ? 'bg-primary' : 'bg-gray-600'} ring-2 ring-background-dark`}></div>
              <div className={`absolute -right-1 top-1/2 -translate-y-1/2 size-2 rounded-full ${isSelected ? 'bg-primary' : 'bg-gray-600'} ring-2 ring-background-dark`}></div>
            </div>
          );
        })}
      </div>
      
      <div className="absolute bottom-4 left-4 bg-surface-dark/90 backdrop-blur border border-border-dark rounded-full px-3 py-1 text-xs text-gray-400 z-20 pointer-events-none select-none">
        Auto-Layout: {Math.round(transform.scale * 100)}%
      </div>
    </div>
  );
};
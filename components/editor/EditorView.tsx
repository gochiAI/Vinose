import React, { useState, useEffect } from 'react';
import { FlowCanvas } from './FlowCanvas';
import { ScriptEditor } from './ScriptEditor';
import { Inspector } from './Inspector';
import { SceneNode, HeaderInfo } from '../../types';
import { useDatabase } from '../../contexts/DatabaseContext';

type LayoutMode = 'split' | 'fullscreen_script' | 'fullscreen_flow';

interface EditorViewProps {
  onHeaderChange?: (info: HeaderInfo) => void;
  nodes: SceneNode[];
  setNodes: (nodes: SceneNode[]) => void;
  chapterId?: string;
  onNodeSelect?: (nodeId: string) => void;
}

export const EditorView = ({ onHeaderChange, nodes, setNodes, chapterId, onNodeSelect }: EditorViewProps) => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('fullscreen_flow');
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const db = useDatabase();
  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[0]?.id || '');

  // nodes が変わったときに selectedNodeId をリセット
  useEffect(() => {
    console.log('[EditorView] nodes changed:', nodes.length, 'nodes, selectedNodeId:', selectedNodeId);
    console.log('[EditorView] nodes sample:', nodes.slice(0, 2).map(n => ({ id: n.id, chapterId: n.chapterId, title: n.title })));
    if (nodes.length > 0 && (!selectedNodeId || !nodes.find(n => n.id === selectedNodeId))) {
      console.log('[EditorView] Resetting selectedNodeId to:', nodes[0].id);
      setSelectedNodeId(nodes[0].id);
    }
  }, [nodes]);

  // 選択されたノードIDを親に伝える
  useEffect(() => {
    if (onNodeSelect && selectedNodeId) {
      onNodeSelect(selectedNodeId);
    }
  }, [selectedNodeId, onNodeSelect]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  // ヘッダー情報を更新（ノード選択時）
  useEffect(() => {
    if (onHeaderChange && selectedNode && chapterId) {
      console.log('[EditorView] Updating header - node:', selectedNode.title, 'chapterId:', chapterId);
      Promise.all([
        db.getChapters(),
        db.getProjectInfo()
      ]).then(([ch, projectInfo]) => {
        const currentChapter = ch.find(c => c.id === chapterId);
        onHeaderChange({
          title: projectInfo?.name || 'Eternal Echoes',
          chapter: currentChapter?.title || 'Unknown Chapter',
          scene: selectedNode.title || 'Start'
        });
      });
    }
  }, [selectedNodeId, selectedNode, chapterId, onHeaderChange, db]);

  const handleNodeUpdate = async (id: string, updates: Partial<SceneNode>) => {
    const updatedNodes = nodes.map(n => n.id === id ? { ...n, ...updates } : n);
    setNodes(updatedNodes);
    
    // Save to database
    const updatedNode = updatedNodes.find(n => n.id === id);
    if (updatedNode) {
      try {
        await db.saveNode(updatedNode);
      } catch (error) {
        console.error('Failed to save node:', error);
      }
    }
  };

  // Extract connections from script content to visualize lines in FlowCanvas
  const parseConnectionsFromScript = (script: string): string[] => {
    const connections: Set<string> = new Set();
    
    // Find [GOTO: id]
    const gotoMatches = script.matchAll(/\[GOTO:\s*([^\]]+)\]/g);
    for (const match of gotoMatches) {
      if (match[1]) connections.add(match[1].trim());
    }

    // Find [CHOICE] targets (=> id)
    // Matches "Text => id" or "[IF:...] => id"
    const choiceMatches = script.matchAll(/=>\s*([a-zA-Z0-9-]+)/g);
    for (const match of choiceMatches) {
      if (match[1]) connections.add(match[1].trim());
    }

    return Array.from(connections);
  };

  const handleScriptUpdate = (text: string) => {
    // 1. Parse connections from text
    const nextIds = parseConnectionsFromScript(text);
    
    // 2. Update Node
    handleNodeUpdate(selectedNodeId, { 
      script: text,
      nextIds: nextIds 
    });
  };

  // Add a standalone node (unconnected)
  const handleAddNode = async () => {
    const newNodeId = Date.now().toString();
    const nodeChapterId = chapterId || selectedNode?.chapterId || 'Default';
    
    const newNode: SceneNode = {
      id: newNodeId,
      title: 'New Scene',
      type: 'scene',
      chapterId: nodeChapterId,
      summary: '...',
      nextIds: [],
      script: ''
    };
    
    setNodes([...nodes, newNode]);
    setSelectedNodeId(newNodeId);
    
    // Save to database
    try {
      await db.createNode(newNode);
    } catch (error) {
      console.error('Failed to create node:', error);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* Flow Canvas Area */}
      <div className={`${layoutMode === 'fullscreen_script' ? 'hidden' : 'flex-1'} relative transition-all duration-300`}>
        <FlowCanvas 
          nodes={nodes} 
          selectedNodeId={selectedNodeId} 
          onNodeSelect={(id) => setSelectedNodeId(id)}
          onAddNode={handleAddNode}
          layoutMode={layoutMode}
          onToggleLayout={() => setLayoutMode(layoutMode === 'split' ? 'fullscreen_flow' : 'split')}
          onOpenScript={() => setLayoutMode('split')}
        />
      </div>
      
      {/* Script Editor Area */}
      {(layoutMode === 'split' || layoutMode === 'fullscreen_script') && (
        <ScriptEditor 
          node={selectedNode}
          allNodes={nodes}
          onUpdate={handleScriptUpdate}
          onClose={() => setLayoutMode('fullscreen_flow')}
          isFullscreen={layoutMode === 'fullscreen_script'}
          onToggleFullscreen={() => setLayoutMode(layoutMode === 'split' ? 'fullscreen_script' : 'split')}
          isInspectorOpen={isInspectorOpen}
          onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
        />
      )}
      
      {/* Inspector Area */}
      {layoutMode === 'split' && isInspectorOpen && (
        <Inspector 
          node={selectedNode} 
          onUpdate={(updates) => handleNodeUpdate(selectedNodeId, updates)}
          onClose={() => setIsInspectorOpen(false)}
        />
      )}
    </div>
  );
};
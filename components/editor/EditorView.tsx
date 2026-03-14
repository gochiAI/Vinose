import React, { useState, useEffect } from "react";
import { FlowCanvas } from "./FlowCanvas";
import { ScriptEditor } from "./ScriptEditor";
import { Inspector } from "./Inspector";
import {
  SceneNode,
  HeaderInfo,
  Block,
  ExtendedCharacter,
  Asset,
} from "../../types";
import { useDatabase } from "../../contexts/DatabaseContext";

type LayoutMode = "split" | "fullscreen_script" | "fullscreen_flow";

interface EditorViewProps {
  onHeaderChange?: (info: HeaderInfo) => void;
  nodes: SceneNode[];
  setNodes: (nodes: SceneNode[]) => void;
  chapterId?: string;
  episodeId?: string;
  onNodeSelect?: (nodeId: string) => void;
}

export const EditorView = ({
  onHeaderChange,
  nodes,
  setNodes,
  chapterId,
  episodeId,
  onNodeSelect,
}: EditorViewProps) => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("fullscreen_flow");
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const db = useDatabase();
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    nodes[0]?.id || "",
  );
  const [characters, setCharacters] = useState<ExtendedCharacter[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  // nodes が変わったときに selectedNodeId をリセット
  useEffect(() => {
    console.log(
      "[EditorView] nodes changed:",
      nodes.length,
      "nodes, selectedNodeId:",
      selectedNodeId,
    );
    console.log(
      "[EditorView] nodes sample:",
      nodes
        .slice(0, 2)
        .map((n) => ({ id: n.id, chapterId: n.chapterId, title: n.title })),
    );
    if (
      nodes.length > 0 &&
      (!selectedNodeId || !nodes.find((n) => n.id === selectedNodeId))
    ) {
      console.log("[EditorView] Resetting selectedNodeId to:", nodes[0].id);
      setSelectedNodeId(nodes[0].id);
    }
  }, [nodes]);

  // Load characters and assets for script blocks (avatar selection, media selection)
  useEffect(() => {
    const load = async () => {
      try {
        const [chars, assetList] = await Promise.all([
          db.getCharacters(),
          db.getAssets(),
        ]);
        setCharacters(chars);
        setAssets(assetList);
      } catch (error) {
        console.error("[EditorView] Failed to load characters/assets", error);
      }
    };
    load();
  }, [db]);

  // 選択されたノードIDを親に伝える
  useEffect(() => {
    if (onNodeSelect && selectedNodeId) {
      onNodeSelect(selectedNodeId);
    }
  }, [selectedNodeId, onNodeSelect]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  // ヘッダー情報を更新（ノード選択時）
  useEffect(() => {
    if (onHeaderChange && selectedNode && chapterId) {
      console.log(
        "[EditorView] Updating header - node:",
        selectedNode.title,
        "chapterId:",
        chapterId,
      );
      Promise.all([db.getChapters(), db.getProjectInfo()]).then(
        ([ch, projectInfo]) => {
          const currentChapter = ch.find((c) => c.id === chapterId);
          onHeaderChange({
            title: projectInfo?.name || "Eternal Echoes",
            chapter: currentChapter?.title || "Unknown Chapter",
            scene: selectedNode.title || "Start",
          });
        },
      );
    }
  }, [selectedNodeId, selectedNode, chapterId, onHeaderChange, db]);

  const handleNodeUpdate = async (id: string, updates: Partial<SceneNode>) => {
    const updatedNodes = nodes.map((n) =>
      n.id === id ? { ...n, ...updates } : n,
    );
    setNodes(updatedNodes);

    // Save to database
    const updatedNode = updatedNodes.find((n) => n.id === id);
    if (updatedNode) {
      try {
        await db.saveSceneNode(updatedNode);
      } catch (error) {
        console.error("Failed to save node:", error);
      }
    }
  };

  const handleScriptUpdate = (newBlocks: Block[]) => {
    // 1. Extract nextIds from block graph
    const nextIds: string[] = [];
    newBlocks.forEach((block) => {
      if (block.type === "move" && block.content.targetNodeId) {
        nextIds.push(block.content.targetNodeId);
      }
      if (block.type === "choice") {
        block.content.options.forEach((opt) => {
          if (opt.target) nextIds.push(opt.target);
        });
      }
    });

    // 2. Update node with Block[] script
    handleNodeUpdate(selectedNodeId, {
      script: newBlocks,
      nextIds,
    });
  };

  // Add a standalone node (unconnected)
  const handleAddNode = async () => {
    const newNodeId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const nodeChapterId = chapterId || selectedNode?.chapterId || "Default";
    const nodeEpisodeId = episodeId || selectedNode?.episodeId;

    const newNode: SceneNode = {
      id: newNodeId,
      title: "New Scene",
      type: "scene",
      chapterId: nodeChapterId,
      ...(nodeEpisodeId && { episodeId: nodeEpisodeId }),
      summary: "...",
      nextIds: [],
      script: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNodes([...nodes, newNode]);
    setSelectedNodeId(newNodeId);

    // Save to database
    try {
      await db.saveSceneNode(newNode);
    } catch (error) {
      console.error("Failed to create node:", error);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* Flow Canvas Area */}
      <div
        className={`${layoutMode === "fullscreen_script" ? "hidden" : "flex-1"} relative transition-all duration-300`}
      >
        <FlowCanvas
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onNodeSelect={(id) => setSelectedNodeId(id)}
          onAddNode={handleAddNode}
          layoutMode={layoutMode}
          onToggleLayout={() =>
            setLayoutMode(layoutMode === "split" ? "fullscreen_flow" : "split")
          }
          onOpenScript={() => setLayoutMode("split")}
        />
      </div>

      {/* Script Editor Area */}
      {(layoutMode === "split" || layoutMode === "fullscreen_script") && (
        <ScriptEditor
          node={selectedNode}
          allNodes={nodes}
          onUpdate={handleScriptUpdate}
          onClose={() => setLayoutMode("fullscreen_flow")}
          isFullscreen={layoutMode === "fullscreen_script"}
          onToggleFullscreen={() =>
            setLayoutMode(
              layoutMode === "split" ? "fullscreen_script" : "split",
            )
          }
          isInspectorOpen={isInspectorOpen}
          onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
          characters={characters}
          assets={assets}
        />
      )}

      {/* Inspector Area */}
      {layoutMode === "split" && isInspectorOpen && (
        <Inspector
          node={selectedNode}
          onUpdate={(updates) => handleNodeUpdate(selectedNodeId, updates)}
          onClose={() => setIsInspectorOpen(false)}
        />
      )}
    </div>
  );
};

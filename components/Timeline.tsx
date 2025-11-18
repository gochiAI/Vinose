import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Scene, EventType, BranchEvent, BranchMode, Group, Variable, Condition, ConditionOperator } from '../types';
import { Button } from './ui/Button';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { MinusIcon } from './icons/MinusIcon';
import { HomeIcon } from './icons/HomeIcon';
import { useSettings } from '../contexts/SettingsContext';
import { ContextMenuItem } from './ui/ContextMenu';
import { InfoIcon } from './icons/InfoIcon';
import { PlayIcon } from './icons/PlayIcon';
import { Minimap } from './Minimap';
import { MapIcon } from './icons/MapIcon';
import { useKeyboardShortcuts, ShortcutMap } from '../hooks/useKeyboardShortcuts';

interface TimelineProps {
  scenes: Scene[];
  groups: Group[];
  variables: Variable[];
  onEditScene: (id: string) => void;
  onViewScene: (id: string) => void;
  onDeleteScene: (id: string) => void;
  selectedSceneId?: string;
  focusedNodeId: string | null;
  setFocusedNodeId: (id: string | null) => void;
  onAddScene: () => void;
  showContextMenu: (event: React.MouseEvent, items: ContextMenuItem[]) => void;
  onStartPreview: (id: string) => void;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const HORIZONTAL_GAP = 80;
const VERTICAL_GAP = 40;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;
const GROUP_PADDING = 40;
const GROUP_HEADER_HEIGHT = 48;
const GROUP_VERTICAL_GAP = 60;


const getCurvePath = (x1: number, y1: number, x2: number, y2: number): string => {
  const midX = x1 + (x2 - x1) / 2;
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
};

const SceneNode = React.memo(({ scene, index, position, isSelected, isFocused, isStartNode, onClick, onDelete, onContextMenu, t, language }: {
    scene: Scene;
    index: number;
    position: { x: number; y: number };
    isSelected: boolean;
    isFocused: boolean;
    isStartNode: boolean;
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
    onContextMenu: (e: React.MouseEvent) => void;
    t: (key: any, lang: any) => string;
    language: 'en' | 'ja';
}) => (
    <div
      style={{
        left: position.x,
        top: position.y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      }}
      className={`absolute p-2 rounded-lg cursor-pointer transition-all duration-200 flex flex-col justify-center scene-node ${
        isSelected ? 'bg-secondary ring-2 ring-ring shadow-lg' : isFocused ? 'bg-card ring-2 ring-primary shadow-md' : 'bg-card hover:bg-secondary shadow-md'
      } ${isStartNode ? 'border-2 border-primary' : 'border border-border'}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
        <div className="flex justify-between items-start">
            <h3 className="font-bold text-sm text-foreground truncate" title={scene.title || t('untitledScene', language)}>
                {t('scene', language)} {index + 1}: {scene.title || t('untitledScene', language)}
            </h3>
            <button
                onClick={onDelete}
                className="p-1 rounded-full text-muted-foreground hover:bg-border hover:text-danger flex-shrink-0"
                title={t('deleteScene', language)}
            >
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
            {scene.events.length} {scene.events.length !== 1 ? t('events', language) : t('event', language)}
        </p>
    </div>
));

export const Timeline: React.FC<TimelineProps> = ({ scenes, groups, variables, onEditScene, onViewScene, onDeleteScene, selectedSceneId, focusedNodeId, setFocusedNodeId, onAddScene, showContextMenu, onStartPreview }) => {
  const [viewTransform, setViewTransform] = useState({ x: 20, y: 20, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);
  const [isMinimapOpen, setIsMinimapOpen] = useState(true);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t, language } = useSettings();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
        setViewportSize({
            width: container.clientWidth,
            height: container.clientHeight,
        });
    });

    resizeObserver.observe(container);
    setViewportSize({ width: container.clientWidth, height: container.clientHeight });

    // ネイティブイベントリスナーは削除（Reactの合成イベントで処理）
    return () => {
      resizeObserver.disconnect();
    };
  }, []); // isPanningへの依存を削除

  const { nodePositions, edges, contentSize, layoutGroups, allScenesSorted } = useMemo(() => {
    const sceneMap = new Map(scenes.map(s => [s.id, s]));

    const formatCondition = (condition: Condition, variables: Variable[]): string => {
        const variable = variables.find(v => v.id === condition.variableId);
        if (!variable) return '...';
        return `${variable.name} ${t(condition.operator as any, language)} ${condition.value}`;
    };

    const getNextSceneConnections = (scene: Scene): { to: string, label?: string }[] => {
        const connections: { to: string, label?: string }[] = [];
        scene.events.forEach(e => {
            if (e.type === EventType.GOTO_SCENE) {
                connections.push({ to: e.nextSceneId });
            } else if (e.type === EventType.BRANCH) {
                if (e.mode === BranchMode.PLAYER_CHOICE && e.choices) {
                    e.choices.forEach(c => connections.push({ to: c.nextSceneId, label: c.text }));
                } else if (e.mode === BranchMode.AUTO_CONDITION && e.branches) {
                    e.branches.forEach(b => {
                        if (b.condition) {
                           connections.push({ to: b.nextSceneId, label: formatCondition(b.condition, variables) });
                        } else {
                           connections.push({ to: b.nextSceneId, label: t('elseCondition', language) });
                        }
                    });
                }
            }
        });
        return connections.filter(conn => !!conn.to);
    };

    const scenesByGroup = new Map<string, Scene[]>();
    scenesByGroup.set('unassigned', []);
    groups.forEach(p => scenesByGroup.set(p.id, []));

    scenes.forEach(s => {
        const groupId = s.groupId && scenesByGroup.has(s.groupId) ? s.groupId : 'unassigned';
        scenesByGroup.get(groupId)?.push(s);
    });

    const groupOrder = ['unassigned', ...groups.map(p => p.id)];
    let currentY = 0;
    const finalNodePositions: { [key: string]: { x: number, y: number } } = {};
    const finalEdges: { from: string, to: string, label?: string }[] = [];
    const finalLayoutGroups: { id: string, title: string, x: number, y: number, width: number, height: number, color: string }[] = [];
    let maxContentWidth = 0;
    const allScenesSorted: Scene[] = [];

    for (const groupId of groupOrder) {
        const groupScenes = scenesByGroup.get(groupId);
        if (!groupScenes || groupScenes.length === 0) continue;

        const groupSceneIds = new Set(groupScenes.map(s => s.id));
        const positions: { [key: string]: { x: number, y: number } } = {};
        
        const columns: Scene[][] = [];
        const placedScenes = new Set<string>();

        // FIX: Add explicit type annotation to prevent potential inference issues on reassignment inside the loop.
        let currentColumnScenes: Scene[] = groupScenes.filter(s => !groupScenes.some(other => getNextSceneConnections(other).some(conn => conn.to === s.id)));
        if (currentColumnScenes.length === 0 && groupScenes.length > 0) currentColumnScenes = [groupScenes[0]];

        while(currentColumnScenes.length > 0) {
            columns.push(currentColumnScenes);
            currentColumnScenes.forEach(s => placedScenes.add(s.id));
            const nextColumnScenes = new Set<Scene>();
            // FIX: Refactored to use a type-guarded approach to avoid potential TypeScript inference issues.
            // This ensures `nextScene` is correctly identified as a `Scene` object before being added.
            currentColumnScenes.forEach(scene => {
                getNextSceneConnections(scene).forEach(conn => {
                    const nextScene = sceneMap.get(conn.to);
                    if (nextScene && groupSceneIds.has(conn.to) && !placedScenes.has(conn.to)) {
                        nextColumnScenes.add(nextScene);
                    }
                });
            });
            // FIX: Using Array.from() to convert the Set to an Array. This can be more robust
            // for type inference in some TypeScript environments than the spread syntax.
            currentColumnScenes = Array.from(nextColumnScenes);
        }

        let maxRows = 0;
        columns.forEach((col, colIndex) => {
            maxRows = Math.max(maxRows, col.length);
            col.forEach((scene, rowIndex) => {
                positions[scene.id] = {
                    x: colIndex * (NODE_WIDTH + HORIZONTAL_GAP),
                    y: rowIndex * (NODE_HEIGHT + VERTICAL_GAP),
                };
            });
        });

        // FIX: Split chained .filter().forEach() to help TypeScript's type inference.
        const unplacedScenes: Scene[] = groupScenes.filter(s => !placedScenes.has(s.id));
        // FIX: With `unplacedScenes` explicitly typed, `scene` is correctly inferred as `Scene`.
        unplacedScenes.forEach((scene, index) => {
            positions[scene.id] = {
                x: 0,
                y: (maxRows + index) * (NODE_HEIGHT + VERTICAL_GAP),
            };
        });
        
        const groupWidth = (columns.length > 0 ? (columns.length -1) : 0) * (NODE_WIDTH + HORIZONTAL_GAP) + NODE_WIDTH;
        const groupHeight = Math.max(...Object.values(positions).map(p => p.y), 0) + NODE_HEIGHT;
        const group = groups.find(p => p.id === groupId);

        finalLayoutGroups.push({
            id: groupId,
            title: groupId === 'unassigned' ? t('unnamed', language) : group?.title || '',
            x: GROUP_PADDING / 2,
            y: currentY + GROUP_PADDING / 2,
            width: groupWidth + GROUP_PADDING,
            height: groupHeight + GROUP_PADDING + GROUP_HEADER_HEIGHT,
            color: group?.color || '#808080',
        });

        maxContentWidth = Math.max(maxContentWidth, groupWidth + GROUP_PADDING * 2);

        Object.entries(positions).forEach(([sceneId, pos]) => {
            finalNodePositions[sceneId] = {
                x: pos.x + GROUP_PADDING,
                y: pos.y + currentY + GROUP_PADDING + GROUP_HEADER_HEIGHT,
            };
        });

        currentY += groupHeight + GROUP_PADDING * 2 + GROUP_HEADER_HEIGHT + GROUP_VERTICAL_GAP;
    }

    scenes.forEach(scene => {
        allScenesSorted.push(scene);
        getNextSceneConnections(scene).forEach(conn => {
            if (sceneMap.has(conn.to)) {
                finalEdges.push({ from: scene.id, to: conn.to, label: conn.label });
            }
        });
    });

    const contentSize = { width: Math.max(500, maxContentWidth), height: Math.max(300, currentY) };

    return { nodePositions: finalNodePositions, edges: finalEdges, contentSize, layoutGroups: finalLayoutGroups, allScenesSorted };
  }, [scenes, groups, variables, t, language]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.scene-node')) return; 
    e.preventDefault();
    e.stopPropagation();
    setIsPanning(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing';
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    if(containerRef.current) {
        containerRef.current.style.cursor = 'grab';
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setViewTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [isPanning]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.scene-node')) return;
    
    e.stopPropagation();
    
    if (e.touches.length === 1) {
      setIsPanning(true);
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistance.current = distance;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    
    if (e.touches.length === 1 && isPanning) {
      const dx = e.touches[0].clientX - lastMousePos.current.x;
      const dy = e.touches[0].clientY - lastMousePos.current.y;
      setViewTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      const container = containerRef.current;
      if (!container) return;

      const newDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const rect = container.getBoundingClientRect();
      const localX = centerX - rect.left;
      const localY = centerY - rect.top;

      const scaleFactor = newDistance / lastTouchDistance.current;
      const newScale = viewTransform.scale * scaleFactor;
      const clampedScale = Math.max(MIN_ZOOM, Math.min(newScale, MAX_ZOOM));

      const worldX = (localX - viewTransform.x) / viewTransform.scale;
      const worldY = (localY - viewTransform.y) / viewTransform.scale;

      const newX = localX - worldX * clampedScale;
      const newY = localY - worldY * clampedScale;

      setViewTransform({ x: newX, y: newY, scale: clampedScale });
      lastTouchDistance.current = newDistance;
    }
  }, [isPanning, viewTransform]);

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    lastTouchDistance.current = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    // preventDefault()を削除
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = 1.1;
    const newScale = e.deltaY < 0 ? viewTransform.scale * zoomFactor : viewTransform.scale / zoomFactor;
    const clampedScale = Math.max(MIN_ZOOM, Math.min(newScale, MAX_ZOOM));

    const worldX = (mouseX - viewTransform.x) / viewTransform.scale;
    const worldY = (mouseY - viewTransform.y) / viewTransform.scale;

    const newX = mouseX - worldX * clampedScale;
    const newY = mouseY - worldY * clampedScale;
    
    setViewTransform({ x: newX, y: newY, scale: clampedScale });
  }, [viewTransform]);

  const handleZoom = (direction: 'in' | 'out') => {
      const container = containerRef.current;
      if (!container) return;

      const centerX = container.clientWidth / 2;
      const centerY = container.clientHeight / 2;

      const zoomFactor = 1.25;
      const newScale = direction === 'in' ? viewTransform.scale * zoomFactor : viewTransform.scale / zoomFactor;
      const clampedScale = Math.max(MIN_ZOOM, Math.min(newScale, MAX_ZOOM));

      const worldX = (centerX - viewTransform.x) / viewTransform.scale;
      const worldY = (centerY - viewTransform.y) / viewTransform.scale;

      const newX = centerX - worldX * clampedScale;
      const newY = centerY - worldY * clampedScale;

      setViewTransform({ x: newX, y: newY, scale: clampedScale });
  };

  const handlePan = (dx: number, dy: number) => {
      setViewTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  };
  
  const handleResetView = () => {
    setViewTransform({ x: 20, y: 20, scale: 1 });
  };

  const handleContainerContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.scene-node')) return;
    showContextMenu(e, [
        { label: t('addScene', language), onClick: onAddScene },
    ]);
  };

  const allSuccessors = useMemo(() => {
    const successors = new Map<string, Set<string>>();
    scenes.forEach(s => successors.set(s.id, new Set()));
    edges.forEach(edge => successors.get(edge.from)?.add(edge.to));
    return successors;
  }, [scenes, edges]);
  
  const findNextNode = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!focusedNodeId) {
        if (allScenesSorted.length > 0) setFocusedNodeId(allScenesSorted[0].id);
        return;
    }

    const currentPos = nodePositions[focusedNodeId];
    if (!currentPos) return;

    let bestCandidateId: string | null = null;
    let minDistance = Infinity;

    for (const scene of allScenesSorted) {
        if (scene.id === focusedNodeId) continue;
        const candidatePos = nodePositions[scene.id];
        if (!candidatePos) continue;

        const dx = candidatePos.x - currentPos.x;
        const dy = candidatePos.y - currentPos.y;

        let isCandidate = false;
        let distance = Infinity;

        switch(direction) {
            case 'right':
                if (dx > 0) { isCandidate = true; distance = Math.sqrt(dx*dx + (dy*2)*(dy*2)); } // Penalize vertical distance
                break;
            case 'left':
                if (dx < 0) { isCandidate = true; distance = Math.sqrt((dx*dx) + (dy*2)*(dy*2)); }
                break;
            case 'down':
                if (dy > 0) { isCandidate = true; distance = Math.sqrt((dx*2)*(dx*2) + dy*dy); } // Penalize horizontal distance
                break;
            case 'up':
                if (dy < 0) { isCandidate = true; distance = Math.sqrt((dx*2)*(dx*2) + dy*dy); }
                break;
        }

        if (isCandidate && distance < minDistance) {
            minDistance = distance;
            bestCandidateId = scene.id;
        }
    }
    if (bestCandidateId) {
        setFocusedNodeId(bestCandidateId);
    }
}, [focusedNodeId, nodePositions, allScenesSorted, setFocusedNodeId]);

  const shortcutHandlers: ShortcutMap = useMemo(() => ({
      NEW_SCENE: onAddScene,
      DELETE_NODE: () => focusedNodeId && onDeleteScene(focusedNodeId),
      EDIT_NODE: () => focusedNodeId && onEditScene(focusedNodeId),
      NAV_UP: () => findNextNode('up'),
      NAV_DOWN: () => findNextNode('down'),
      NAV_LEFT: () => findNextNode('left'),
      NAV_RIGHT: () => findNextNode('right'),
      ZOOM_IN: () => handleZoom('in'),
      ZOOM_OUT: () => handleZoom('out'),
      PAN_VIEW_UP: () => handlePan(0, 50),
      PAN_VIEW_DOWN: () => handlePan(0, -50),
      PAN_VIEW_LEFT: () => handlePan(50, 0),
      PAN_VIEW_RIGHT: () => handlePan(-50, 0),
  }), [onAddScene, onDeleteScene, onEditScene, focusedNodeId, findNextNode]);

  useKeyboardShortcuts(shortcutHandlers);

  return (
    <div className="flex-1 relative" data-tour-id="timeline-view">
        <div 
            ref={containerRef}
            className="w-full h-full bg-background border-2 border-dashed border-border rounded-lg overflow-hidden relative cursor-grab focus:outline-none touch-none overscroll-none"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            onContextMenu={handleContainerContextMenu}
            tabIndex={0}
            style={{ touchAction: 'none' }}
        >
            <div
                className="absolute"
                style={{ transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})` }}
            >
                <svg
                    width={contentSize.width}
                    height={contentSize.height}
                    className="absolute top-0 left-0"
                    style={{ color: 'var(--border)'}}
                >
                    <defs>
                        <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="7"
                            refX="10"
                            refY="3.5"
                            orient="auto"
                            markerUnits="strokeWidth"
                        >
                            <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
                        </marker>
                    </defs>
                    {edges.map(({ from, to, label }, index) => {
                        const fromPos = nodePositions[from];
                        const toPos = nodePositions[to];
                        if (!fromPos || !toPos) return null;
                        
                        const startX = fromPos.x + NODE_WIDTH;
                        const startY = fromPos.y + NODE_HEIGHT / 2;
                        const endX = toPos.x;
                        const endY = toPos.y + NODE_HEIGHT / 2;
                        const pathId = `path-${from}-${to}-${index}`;

                        return (
                           <React.Fragment key={pathId}>
                                <path
                                    id={pathId}
                                    d={getCurvePath(startX, startY, endX, endY)}
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    fill="none"
                                    markerEnd="url(#arrowhead)"
                                />
                                {showEdgeLabels && label && (
                                    <text dy="-4" className="text-xs font-semibold" fill="rgb(var(--foreground))" style={{ paintOrder: 'stroke', stroke: 'rgb(var(--background))', strokeWidth: '4px', strokeLinejoin: 'round' }}>
                                        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
                                            {label}
                                        </textPath>
                                    </text>
                                )}
                            </React.Fragment>
                        );
                    })}
                </svg>

                {layoutGroups.map(group => (
                    <div
                        key={group.id}
                        className="absolute bg-secondary/30 rounded-xl p-4 border-2 border-dashed"
                        style={{
                            left: group.x,
                            top: group.y,
                            width: group.width,
                            height: group.height,
                            borderColor: group.color,
                        }}
                    >
                        <h2 className="text-lg font-bold text-foreground -mt-1 mb-2" style={{ color: group.color }}>{group.title}</h2>
                    </div>
                ))}

                {allScenesSorted.map((scene, index) => {
                    const position = nodePositions[scene.id];
                    const isStartNode = !scenes.some(s => allSuccessors.get(s.id)?.has(scene.id));
                    if (!position) return null;
                    return (
                        <SceneNode
                            key={scene.id}
                            scene={scene}
                            index={index}
                            position={position}
                            isSelected={scene.id === selectedSceneId}
                            isFocused={scene.id === focusedNodeId}
                            isStartNode={isStartNode}
                            onClick={() => onEditScene(scene.id)}
                            onDelete={(e) => {
                                e.stopPropagation();
                                onDeleteScene(scene.id);
                            }}
                            onContextMenu={(e) => {
                                showContextMenu(e, [
                                  { label: t('startPreviewHere', language), icon: PlayIcon, onClick: () => onStartPreview(scene.id) },
                                  { isSeparator: true },
                                  { label: `${t('view', language)} ${t('scene', language)}`, onClick: () => onViewScene(scene.id) },
                                  { label: `${t('edit', language)} ${t('scene', language)}`, onClick: () => onEditScene(scene.id) },
                                  { isSeparator: true },
                                  { label: `${t('delete', language)} ${t('scene', language)}`, onClick: () => onDeleteScene(scene.id), isDanger: true },
                                ]);
                            }}
                            t={t}
                            language={language}
                        />
                    );
                })}

                {scenes.length === 0 && (
                  <div className="absolute top-1/2 left-1/2 text-center" style={{ transform: `translate(-50%, -50%) scale(${1 / viewTransform.scale})` }}>
                      <p className="text-muted-foreground">{t('noScenes', language)}</p>
                      <Button onClick={onAddScene} size="sm" className="mt-4">
                          {t('createFirstScene', language)}
                      </Button>
                  </div>
                )}
            </div>
        </div>
         <div className="absolute bottom-3 right-3 flex flex-col gap-2">
            <button title={t('zoomIn', language)} onClick={() => handleZoom('in')} className="w-8 h-8 flex items-center justify-center bg-card text-foreground rounded-md hover:bg-secondary transition-colors shadow-lg"><PlusIcon className="w-5 h-5"/></button>
            <button title={t('zoomOut', language)} onClick={() => handleZoom('out')} className="w-8 h-8 flex items-center justify-center bg-card text-foreground rounded-md hover:bg-secondary transition-colors shadow-lg"><MinusIcon className="w-5 h-5"/></button>
            <button title={t('resetView', language)} onClick={handleResetView} className="w-8 h-8 flex items-center justify-center bg-card text-foreground rounded-md hover:bg-secondary transition-colors shadow-lg"><HomeIcon className="w-5 h-5" /></button>
            <button 
                title={t('toggleEdgeLabels', language)} 
                onClick={() => setShowEdgeLabels(prev => !prev)} 
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors shadow-lg ${showEdgeLabels ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-secondary'}`}>
                <InfoIcon className="w-5 h-5"/>
            </button>
            <button 
                title={t('toggleMinimap', language)} 
                onClick={() => setIsMinimapOpen(prev => !prev)} 
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors shadow-lg ${isMinimapOpen ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-secondary'}`}>
                <MapIcon className="w-5 h-5"/>
            </button>
        </div>
        {isMinimapOpen && scenes.length > 0 && viewportSize.width > 0 && (
            <Minimap
                nodePositions={nodePositions}
                groups={layoutGroups}
                contentSize={contentSize}
                viewTransform={viewTransform}
                viewportSize={viewportSize}
                onViewChange={setViewTransform}
                nodeSize={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
            />
        )}
    </div>
  );
};

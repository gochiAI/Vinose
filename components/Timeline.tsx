import React, { useMemo, useState, useRef, useCallback } from 'react';
import { Scene, EventType, GoToSceneEvent, ChoiceEvent } from '../types';
import { Button } from './ui/Button';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { MinusIcon } from './icons/MinusIcon';
import { HomeIcon } from './icons/HomeIcon';
import { useSettings } from '../contexts/SettingsContext';
import { ContextMenuItem } from './ui/ContextMenu';

interface TimelineProps {
  scenes: Scene[];
  onEditScene: (id: string) => void;
  onViewScene: (id: string) => void;
  onDeleteScene: (id: string) => void;
  selectedSceneId?: string;
  onAddScene: () => void;
  showContextMenu: (event: React.MouseEvent, items: ContextMenuItem[]) => void;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const HORIZONTAL_GAP = 80;
const VERTICAL_GAP = 40;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;

const getCurvePath = (x1: number, y1: number, x2: number, y2: number): string => {
  const midX = x1 + (x2 - x1) / 2;
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
};

const SceneNode = React.memo(({ scene, index, position, isSelected, onClick, onDelete, onContextMenu, t, language }: {
    scene: Scene;
    index: number;
    position: { x: number; y: number };
    isSelected: boolean;
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
        isSelected ? 'bg-secondary ring-2 ring-ring shadow-lg' : 'bg-card hover:bg-secondary shadow-md'
      }`}
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

export const Timeline: React.FC<TimelineProps> = ({ scenes, onEditScene, onViewScene, onDeleteScene, selectedSceneId, onAddScene, showContextMenu }) => {
  const [viewTransform, setViewTransform] = useState({ x: 20, y: 20, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { t, language } = useSettings();
  
  const { nodePositions, edges, contentSize } = useMemo(() => {
    const positions: { [key: string]: { x: number; y: number } } = {};
    const calculatedEdges: { from: string; to: string }[] = [];
    const sceneMap: Map<string, Scene> = new Map(scenes.map(s => [s.id, s]));

    const columns: Scene[][] = [];
    const placedScenes = new Set<string>();

    let currentColumnScenes = scenes.filter(s => !scenes.some(other => 
        other.events
            .filter(e => e.type === EventType.CHOICE || e.type === EventType.GOTO_SCENE)
            .flatMap(e => {
                if (e.type === EventType.CHOICE) return (e as ChoiceEvent).choices.map(c => c.nextSceneId);
                if (e.type === EventType.GOTO_SCENE) return [(e as GoToSceneEvent).nextSceneId];
                return [];
            })
            .some(nextId => nextId === s.id)
    ));
    if(currentColumnScenes.length === 0 && scenes.length > 0) {
        currentColumnScenes = [scenes[0]];
    }

    while (currentColumnScenes.length > 0) {
      columns.push(currentColumnScenes);
      currentColumnScenes.forEach(s => placedScenes.add(s.id));
      const nextColumnScenes = new Set<Scene>();
      currentColumnScenes.forEach(scene => {
        scene.events
          .filter(e => e.type === EventType.CHOICE || e.type === EventType.GOTO_SCENE)
          .flatMap(e => {
            if (e.type === EventType.CHOICE) return (e as ChoiceEvent).choices.map(c => c.nextSceneId);
            if (e.type === EventType.GOTO_SCENE) return [(e as GoToSceneEvent).nextSceneId];
            return [];
          })
          .forEach(nextId => {
            if (nextId && sceneMap.has(nextId) && !placedScenes.has(nextId)) {
              // FIX: Explicitly typing `sceneMap` above ensures that `sceneMap.get()` correctly returns a `Scene` type.
              nextColumnScenes.add(sceneMap.get(nextId)!);
            }
          });
      });
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

    const unplacedScenes = scenes.filter(s => !placedScenes.has(s.id));
    unplacedScenes.forEach((scene, index) => {
        positions[scene.id] = {
            x: 0,
            y: (maxRows + index) * (NODE_HEIGHT + VERTICAL_GAP),
        };
    });

    scenes.forEach(scene => {
        scene.events.forEach(event => {
            if (event.type === EventType.CHOICE) {
                (event as ChoiceEvent).choices.forEach((choice) => {
                    if (choice.nextSceneId && positions[choice.nextSceneId]) {
                        calculatedEdges.push({ from: scene.id, to: choice.nextSceneId });
                    }
                });
            } else if (event.type === EventType.GOTO_SCENE) {
                const goToEvent = event as GoToSceneEvent;
                if (goToEvent.nextSceneId && positions[goToEvent.nextSceneId]) {
                    calculatedEdges.push({ from: scene.id, to: goToEvent.nextSceneId });
                }
            }
        });
    });

    const maxX = Math.max(...Object.values(positions).map(p => p.x), 0) + NODE_WIDTH;
    const maxY = Math.max(...Object.values(positions).map(p => p.y), 0) + NODE_HEIGHT;
    const contentSize = { width: Math.max(500, maxX), height: Math.max(300, maxY) };

    return { nodePositions: positions, edges: calculatedEdges, contentSize };
  }, [scenes]);

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

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
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
  
  const handleResetView = () => {
      if (scenes.length === 0) {
          setViewTransform({ x: 20, y: 20, scale: 1 });
          return;
      };
      const firstSceneId = scenes[0].id;
      const firstScenePos = nodePositions[firstSceneId];
      const container = containerRef.current;

      if (firstScenePos && container) {
        const newX = (container.clientWidth / 2) - (firstScenePos.x + NODE_WIDTH / 2) * viewTransform.scale;
        const newY = (container.clientHeight / 2) - (firstScenePos.y + NODE_HEIGHT / 2) * viewTransform.scale;
        setViewTransform(prev => ({ ...prev, x: newX, y: newY, scale: 1 }));
      } else {
         setViewTransform({ x: 20, y: 20, scale: 1 });
      }
  };

  const handleContainerContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.scene-node')) return;
    showContextMenu(e, [
        { label: t('addScene', language), onClick: onAddScene },
    ]);
  };

  return (
    <div className="flex-1 relative" data-tour-id="timeline-view">
        <div 
            ref={containerRef}
            className="w-full h-full bg-background border-2 border-dashed border-border rounded-lg overflow-hidden relative cursor-grab"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
            onContextMenu={handleContainerContextMenu}
        >
            <div
                className="absolute"
                style={{ transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})` }}
            >
                <svg
                    width={contentSize.width}
                    height={contentSize.height}
                    className="absolute top-0 left-0"
                    // The color is taken from the border color which adapts to the theme
                    style={{ color: 'var(--border)'}}
                >
                    <defs>
                        <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="7"
                            refX="9"
                            refY="3.5"
                            orient="auto"
                            markerUnits="strokeWidth"
                        >
                            <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
                        </marker>
                    </defs>
                    {edges.map(({ from, to }) => {
                        const fromPos = nodePositions[from];
                        const toPos = nodePositions[to];
                        if (!fromPos || !toPos) return null;
                        
                        const startX = fromPos.x + NODE_WIDTH;
                        const startY = fromPos.y + NODE_HEIGHT / 2;
                        const endX = toPos.x - 10; // offset for arrowhead
                        const endY = toPos.y + NODE_HEIGHT / 2;

                        return (
                            <path
                                key={`${from}-${to}-${Math.random()}`}
                                d={getCurvePath(startX, startY, endX, endY)}
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                                markerEnd="url(#arrowhead)"
                            />
                        );
                    })}
                </svg>

                {scenes.map((scene, index) => {
                    const position = nodePositions[scene.id];
                    if (!position) return null;
                    return (
                        <SceneNode
                            key={scene.id}
                            scene={scene}
                            index={index}
                            position={position}
                            isSelected={scene.id === selectedSceneId}
                            onClick={() => onEditScene(scene.id)}
                            onDelete={(e) => {
                                e.stopPropagation();
                                onDeleteScene(scene.id);
                            }}
                            onContextMenu={(e) => {
                                showContextMenu(e, [
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
        </div>
    </div>
  );
};
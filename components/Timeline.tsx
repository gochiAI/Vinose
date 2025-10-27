import React, { useMemo, useState, useRef, useCallback } from 'react';
import { Scene, EventType } from '../types';
import { Button } from './ui/Button';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { MinusIcon } from './icons/MinusIcon';
import { HomeIcon } from './icons/HomeIcon';

interface TimelineProps {
  scenes: Scene[];
  onSelectScene: (id: string) => void;
  onDeleteScene: (id: string) => void;
  selectedSceneId?: string;
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

const SceneNode = React.memo(({ scene, index, position, isSelected, onClick, onDelete }: {
    scene: Scene;
    index: number;
    position: { x: number; y: number };
    isSelected: boolean;
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
}) => (
    <div
      style={{
        left: position.x,
        top: position.y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      }}
      className={`absolute p-2 rounded-lg cursor-pointer transition-all duration-200 flex flex-col justify-center scene-node ${
        isSelected ? 'bg-tertiary ring-2 ring-accent shadow-lg' : 'bg-secondary hover:bg-tertiary shadow-md'
      }`}
      onClick={onClick}
    >
        <div className="flex justify-between items-start">
            <h3 className="font-bold text-sm text-text-primary truncate" title={scene.title || 'Untitled Scene'}>
                Scene {index + 1}: {scene.title || 'Untitled Scene'}
            </h3>
            <button
                onClick={onDelete}
                className="p-1 rounded-full text-text-secondary hover:bg-border-color hover:text-red-500 flex-shrink-0"
                title="Delete Scene"
            >
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
        <p className="text-xs text-text-secondary mt-1">
            {scene.events.length} event{scene.events.length !== 1 ? 's' : ''}
        </p>
    </div>
));

export const Timeline: React.FC<TimelineProps> = ({ scenes, onSelectScene, onDeleteScene, selectedSceneId }) => {
  const [viewTransform, setViewTransform] = useState({ x: 20, y: 20, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { nodePositions, edges, contentSize } = useMemo(() => {
    const positions: { [key: string]: { x: number; y: number } } = {};
    const calculatedEdges: { from: string; to: string }[] = [];
    const sceneMap = new Map(scenes.map(s => [s.id, s]));

    const columns: Scene[][] = [];
    const placedScenes = new Set<string>();

    let currentColumnScenes = scenes.filter(s => !scenes.some(other => 
        other.events
            .filter(e => e.type === EventType.CHOICE)
            .flatMap(e => (e as any).choices)
            .some(c => c.nextSceneId === s.id)
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
          .filter(e => e.type === EventType.CHOICE)
          .flatMap(e => (e as any).choices)
          .forEach(c => {
            if (c.nextSceneId && sceneMap.has(c.nextSceneId) && !placedScenes.has(c.nextSceneId)) {
              nextColumnScenes.add(sceneMap.get(c.nextSceneId)!);
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
                (event as any).choices.forEach((choice: any) => {
                    if (choice.nextSceneId && positions[choice.nextSceneId]) {
                        calculatedEdges.push({ from: scene.id, to: choice.nextSceneId });
                    }
                });
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

  const handleAddScene = () => {
    // This function is now handled in App.tsx to select the new scene
    // Kept for potential future use or can be removed
  };

  return (
    <div className="flex-1 relative">
        <div 
            ref={containerRef}
            className="w-full h-full bg-primary border-2 border-dashed border-tertiary rounded-lg overflow-hidden relative cursor-grab"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
        >
            <div
                className="absolute"
                style={{ transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})` }}
            >
                <svg
                    width={contentSize.width}
                    height={contentSize.height}
                    className="absolute top-0 left-0"
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
                            <polygon points="0 0, 10 3.5, 0 7" fill="#4e5058" />
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
                                key={`${from}-${to}`}
                                d={getCurvePath(startX, startY, endX, endY)}
                                stroke="#4e5058"
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
                            onClick={() => onSelectScene(scene.id)}
                            onDelete={(e) => {
                                e.stopPropagation();
                                onDeleteScene(scene.id);
                            }}
                        />
                    );
                })}

                {scenes.length === 0 && (
                  <div className="absolute top-1/2 left-1/2 text-center" style={{ transform: `translate(-50%, -50%) scale(${1 / viewTransform.scale})` }}>
                      <p className="text-text-secondary">No scenes yet.</p>
                      <Button onClick={handleAddScene} size="sm" className="mt-4">
                          Create your first scene
                      </Button>
                  </div>
                )}
            </div>
        </div>
         <div className="absolute bottom-3 right-3 flex flex-col gap-2">
            <button title="Zoom In" onClick={() => handleZoom('in')} className="w-8 h-8 flex items-center justify-center bg-secondary text-text-primary rounded-md hover:bg-tertiary transition-colors shadow-lg"><PlusIcon className="w-5 h-5"/></button>
            <button title="Zoom Out" onClick={() => handleZoom('out')} className="w-8 h-8 flex items-center justify-center bg-secondary text-text-primary rounded-md hover:bg-tertiary transition-colors shadow-lg"><MinusIcon className="w-5 h-5"/></button>
            <button title="Reset View" onClick={handleResetView} className="w-8 h-8 flex items-center justify-center bg-secondary text-text-primary rounded-md hover:bg-tertiary transition-colors shadow-lg"><HomeIcon className="w-5 h-5" /></button>
        </div>
    </div>
  );
};


import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Character, Relationship } from '../types';
import { MinusIcon } from './icons/MinusIcon';
import { HomeIcon } from './icons/HomeIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CharacterIcon } from './icons/CharacterIcon';
import { useSettings } from '../contexts/SettingsContext';
import { ContextMenuItem } from './ui/ContextMenu';
import { Minimap } from './Minimap';
import { MapIcon } from './icons/MapIcon';
import { useKeyboardShortcuts, ShortcutMap } from '../hooks/useKeyboardShortcuts';

interface CharacterGraphProps {
  characters: Character[];
  relationships: Relationship[];
  onEditCharacter: (id: string) => void;
  onViewCharacter: (id: string) => void;
  selectedCharacterId?: string;
  focusedNodeId: string | null;
  setFocusedNodeId: (id: string | null) => void;
  onAddCharacter: () => void;
  onDeleteCharacter: (id: string) => void;
  showContextMenu: (event: React.MouseEvent, items: ContextMenuItem[]) => void;
}

const NODE_RADIUS = 40;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;


const CharacterNode = React.memo(({ character, position, isSelected, isFocused, onClick, onContextMenu, t, language }: {
    character: Character;
    position: { x: number; y: number };
    isSelected: boolean;
    isFocused: boolean;
    onClick: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    t: (key: any, lang: any) => string;
    language: 'en' | 'ja';
}) => (
    <div
      style={{
        left: position.x - NODE_RADIUS,
        top: position.y - NODE_RADIUS,
        width: NODE_RADIUS * 2,
        height: NODE_RADIUS * 2,
      }}
      className={`absolute p-2 rounded-full cursor-pointer transition-all duration-200 flex flex-col justify-center items-center text-center scene-node ${
        isSelected ? 'bg-secondary ring-2 ring-ring shadow-lg' : isFocused ? 'bg-card ring-2 ring-primary shadow-md' : 'bg-card hover:bg-secondary shadow-md'
      }`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      title={character.name}
    >
        <CharacterIcon className="w-6 h-6 text-primary mb-1"/>
        <h3 className="font-bold text-xs text-foreground truncate w-full">
            {character.name || t('unnamed', language)}
        </h3>
    </div>
));

export const CharacterGraph: React.FC<CharacterGraphProps> = ({ characters, relationships, onEditCharacter, onViewCharacter, selectedCharacterId, focusedNodeId, setFocusedNodeId, onAddCharacter, onDeleteCharacter, showContextMenu }) => {
  const [viewTransform, setViewTransform] = useState({ x: 20, y: 20, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [isMinimapOpen, setIsMinimapOpen] = useState(true);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });
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

    return () => resizeObserver.disconnect();
  }, []);
  
  const { nodePositions, edges, contentSize } = useMemo(() => {
    const positions: { [key: string]: { x: number; y: number } } = {};
    
    // Simple circular layout
    const numNodes = characters.length;
    const radius = numNodes > 1 ? Math.max(200, numNodes * 30) : 0;
    const centerX = radius + NODE_RADIUS + 50;
    const centerY = radius + NODE_RADIUS + 50;
    
    characters.forEach((char, i) => {
        const angle = (i / numNodes) * 2 * Math.PI;
        positions[char.id] = {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
        };
    });

    const calculatedEdges = relationships.map(rel => ({
        ...rel,
        sourcePos: positions[rel.sourceCharacterId],
        targetPos: positions[rel.targetCharacterId],
    })).filter(edge => edge.sourcePos && edge.targetPos);


    const width = (radius * 2) + (NODE_RADIUS * 2) + 100;
    const height = (radius * 2) + (NODE_RADIUS * 2) + 100;
    const contentSize = { width: Math.max(500, width), height: Math.max(300, height) };

    return { nodePositions: positions, edges: calculatedEdges, contentSize };
  }, [characters, relationships]);

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
  
  const handlePan = (dx: number, dy: number) => {
      setViewTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  };

  const handleResetView = () => {
      const container = containerRef.current;
      if (container) {
          const newX = (container.clientWidth / 2) - (contentSize.width / 2);
          const newY = (container.clientHeight / 2) - (contentSize.height / 2);
          setViewTransform({ x: newX, y: newY, scale: 1 });
      } else {
          setViewTransform({ x: 20, y: 20, scale: 1 });
      }
  };

  const handleContainerContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.scene-node')) return;
    showContextMenu(e, [
        { label: t('addCharacter', language), onClick: onAddCharacter },
    ]);
  };
  
    const findNextNode = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!focusedNodeId) {
        if (characters.length > 0) setFocusedNodeId(characters[0].id);
        return;
    }

    const currentPos = nodePositions[focusedNodeId];
    if (!currentPos) return;

    let bestCandidateId: string | null = null;
    let minDistance = Infinity;

    for (const char of characters) {
        if (char.id === focusedNodeId) continue;
        const candidatePos = nodePositions[char.id];
        if (!candidatePos) continue;

        const dx = candidatePos.x - currentPos.x;
        const dy = candidatePos.y - currentPos.y;
        
        let isCandidate = false;
        let distance = Infinity;

        switch(direction) {
            case 'right':
                if (dx > 0 && Math.abs(dy) < Math.abs(dx)) { isCandidate = true; distance = Math.sqrt(dx*dx + dy*dy); }
                break;
            case 'left':
                if (dx < 0 && Math.abs(dy) < Math.abs(dx)) { isCandidate = true; distance = Math.sqrt(dx*dx + dy*dy); }
                break;
            case 'down':
                if (dy > 0 && Math.abs(dx) < Math.abs(dy)) { isCandidate = true; distance = Math.sqrt(dx*dx + dy*dy); }
                break;
            case 'up':
                if (dy < 0 && Math.abs(dx) < Math.abs(dy)) { isCandidate = true; distance = Math.sqrt(dx*dx + dy*dy); }
                break;
        }

        if (isCandidate && distance < minDistance) {
            minDistance = distance;
            bestCandidateId = char.id;
        }
    }
    if (bestCandidateId) {
        setFocusedNodeId(bestCandidateId);
    }
  }, [focusedNodeId, nodePositions, characters, setFocusedNodeId]);

  const shortcutHandlers: ShortcutMap = useMemo(() => ({
      NEW_CHARACTER: onAddCharacter,
      DELETE_NODE: () => focusedNodeId && onDeleteCharacter(focusedNodeId),
      EDIT_NODE: () => focusedNodeId && onEditCharacter(focusedNodeId),
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
  }), [onAddCharacter, onDeleteCharacter, onEditCharacter, focusedNodeId, findNextNode]);

  useKeyboardShortcuts(shortcutHandlers);

  return (
    <div className="flex-1 relative" data-tour-id="character-graph-view">
        <div 
            ref={containerRef}
            className="w-full h-full bg-background border-2 border-dashed border-border rounded-lg overflow-hidden relative cursor-grab focus:outline-none"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
            onContextMenu={handleContainerContextMenu}
            tabIndex={0}
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
                            id="rel-arrowhead"
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
                    {edges.map((edge) => {
                        const dx = edge.targetPos.x - edge.sourcePos.x;
                        const dy = edge.targetPos.y - edge.sourcePos.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if(dist === 0) return null;

                        const endX = edge.targetPos.x - (dx / dist) * (NODE_RADIUS + 10); // offset for arrowhead
                        const endY = edge.targetPos.y - (dy / dist) * (NODE_RADIUS + 10);
                        
                        const midX = edge.sourcePos.x + dx * 0.5;
                        const midY = edge.sourcePos.y + dy * 0.5;

                        return (
                            <g key={edge.id}>
                            <path
                                d={`M ${edge.sourcePos.x} ${edge.sourcePos.y} L ${endX} ${endY}`}
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                                markerEnd="url(#rel-arrowhead)"
                            />
                            <text x={midX} y={midY - 5} fill="var(--muted-foreground)" fontSize="12" textAnchor="middle">{edge.type}</text>
                            </g>
                        );
                    })}
                </svg>

                {characters.map((char) => {
                    const position = nodePositions[char.id];
                    if (!position) return null;
                    return (
                        <CharacterNode
                            key={char.id}
                            character={char}
                            position={position}
                            isSelected={char.id === selectedCharacterId}
                            isFocused={char.id === focusedNodeId}
                            onClick={() => onEditCharacter(char.id)}
                            onContextMenu={(e) => {
                                showContextMenu(e, [
                                    { label: `${t('view', language)} ${t('character', language)}`, onClick: () => onViewCharacter(char.id) },
                                    { label: `${t('edit', language)} ${t('character', language)}`, onClick: () => onEditCharacter(char.id) },
                                    { isSeparator: true },
                                    { label: `${t('delete', language)} ${t('character', language)}`, onClick: () => onDeleteCharacter(char.id), isDanger: true },
                                ]);
                            }}
                            t={t}
                            language={language}
                        />
                    );
                })}

                {characters.length === 0 && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-muted-foreground" style={{ transform: `translate(-50%, -50%) scale(${1 / viewTransform.scale})` }}>
                     <p>{t('noCharacters', language)}</p>
                     <p className="text-sm">{t('addCharacterHint', language)}</p>
                  </div>
                )}
            </div>
        </div>
         <div className="absolute bottom-3 right-3 flex flex-col gap-2">
            <button title={t('zoomIn', language)} onClick={() => handleZoom('in')} className="w-8 h-8 flex items-center justify-center bg-card text-foreground rounded-md hover:bg-secondary transition-colors shadow-lg"><PlusIcon className="w-5 h-5"/></button>
            <button title={t('zoomOut', language)} onClick={() => handleZoom('out')} className="w-8 h-8 flex items-center justify-center bg-card text-foreground rounded-md hover:bg-secondary transition-colors shadow-lg"><MinusIcon className="w-5 h-5"/></button>
            <button title={t('resetView', language)} onClick={handleResetView} className="w-8 h-8 flex items-center justify-center bg-card text-foreground rounded-md hover:bg-secondary transition-colors shadow-lg"><HomeIcon className="w-5 h-5" /></button>
            <button 
                title={t('toggleMinimap', language)} 
                onClick={() => setIsMinimapOpen(prev => !prev)} 
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors shadow-lg ${isMinimapOpen ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-secondary'}`}>
                <MapIcon className="w-5 h-5"/>
            </button>
        </div>
        {isMinimapOpen && characters.length > 0 && viewportSize.width > 0 && (
            <Minimap
                nodePositions={nodePositions}
                contentSize={contentSize}
                viewTransform={viewTransform}
                viewportSize={viewportSize}
                onViewChange={setViewTransform}
                nodeSize={{ radius: NODE_RADIUS }}
            />
        )}
    </div>
  );
};

import React, { useRef, useCallback, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface MinimapProps {
  nodePositions: { [key: string]: { x: number; y: number } };
  groups?: { id: string; x: number; y: number; width: number; height: number; color: string }[];
  contentSize: { width: number; height: number };
  viewTransform: { x: number; y: number; scale: number };
  viewportSize: { width: number; height: number };
  onViewChange: (newTransform: { x: number; y: number; scale: number }) => void;
  nodeSize?: { width?: number; height?: number; radius?: number };
}

const MINIMAP_WIDTH = 200;

export const Minimap: React.FC<MinimapProps> = ({
  nodePositions,
  groups = [],
  contentSize,
  viewTransform,
  viewportSize,
  onViewChange,
  nodeSize,
}) => {
  const { theme } = useSettings();
  const minimapRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const scale = MINIMAP_WIDTH / contentSize.width;
  const minimapHeight = contentSize.height * scale;

  const viewportStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${-viewTransform.x * scale}px`,
    top: `${-viewTransform.y * scale}px`,
    width: `${(viewportSize.width / viewTransform.scale) * scale}px`,
    height: `${(viewportSize.height / viewTransform.scale) * scale}px`,
    border: '2px solid rgb(var(--primary))',
    backgroundColor: 'rgba(var(--primary), 0.2)',
    cursor: 'grab',
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    isDragging.current = true;
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
    };
    document.body.classList.add('dragging-no-select');
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    dragStartPos.current = { x: e.clientX, y: e.clientY };

    onViewChange({
      ...viewTransform,
      x: viewTransform.x - dx / scale,
      y: viewTransform.y - dy / scale,
    });
  }, [onViewChange, viewTransform, scale]);
  
  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.classList.remove('dragging-no-select');
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('dragging-no-select');
    };
  }, [handleMouseMove, handleMouseUp]);
  
  const handleMapMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!minimapRef.current || isDragging.current) return;
      if (e.target !== minimapRef.current && (e.target as HTMLElement).parentElement !== minimapRef.current) return;
      const rect = minimapRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const viewportWidth = (viewportSize.width / viewTransform.scale) * scale;
      const viewportHeight = (viewportSize.height / viewTransform.scale) * scale;

      const newViewportX = clickX - viewportWidth / 2;
      const newViewportY = clickY - viewportHeight / 2;
      
      onViewChange({
          ...viewTransform,
          x: -newViewportX / scale,
          y: -newViewportY / scale
      });
  };

  // 色設定（light/darkで分岐）
  const nodeColor = theme === 'light' ? '#555' : '#ddd';
  const groupBorderColor = theme === 'light' ? '#888' : '#ccc';
  const minimapBg = theme === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,30,0.9)';

  return (
    <div
      ref={minimapRef}
      className="absolute bottom-3 left-3 border border-border rounded-md shadow-lg overflow-hidden backdrop-blur-sm animate-fade-in-fast"
      style={{ width: MINIMAP_WIDTH, height: minimapHeight, background: minimapBg }}
      onMouseDown={handleMapMouseDown}
    >
        {groups.map(group => (
            <div
                key={group.id}
                className="absolute border border-dashed opacity-50 pointer-events-none"
                style={{
                    left: group.x * scale,
                    top: group.y * scale,
                    width: group.width * scale,
                    height: group.height * scale,
                    borderColor: groupBorderColor || group.color,
                }}
            />
        ))}
        {Object.values(nodePositions).map((pos: { x: number; y: number }, index) => (
            <div
                key={index}
                className="absolute pointer-events-none"
                style={{
                    left: nodeSize?.radius
                        ? (pos.x - nodeSize.radius) * scale
                        : pos.x * scale,
                    top: nodeSize?.radius
                        ? (pos.y - nodeSize.radius) * scale
                        : pos.y * scale,
                    width: (nodeSize?.radius ? nodeSize.radius * 2 : (nodeSize?.width || 0)) * scale,
                    height: (nodeSize?.radius ? nodeSize.radius * 2 : (nodeSize?.height || 0)) * scale,
                    borderRadius: nodeSize?.radius ? '50%' : '2px',
                    background: nodeColor,
                }}
            />
        ))}

        <div style={viewportStyle} onMouseDown={handleMouseDown} />
    </div>
  );
};

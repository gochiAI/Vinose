import React, { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isSeparator?: boolean;
  isDanger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', onClose);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', onClose);
    };
  }, [onClose]);

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: y,
    left: x,
    zIndex: 100,
  };

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className="bg-card border border-border rounded-md shadow-lg py-1 min-w-[150px] animate-fade-in-fast"
    >
      {items.map((item, index) => {
        if (item.isSeparator) {
          return <div key={index} className="h-px bg-border my-1" />;
        }
        return (
          <button
            key={index}
            disabled={item.disabled}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2
              ${item.isDanger ? 'text-danger hover:bg-danger/10' : 'text-foreground hover:bg-secondary'}
              ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`
            }
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

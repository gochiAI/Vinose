import React, { useEffect, useRef } from 'react';

export type ContextMenuItem =
  | {
      label: string;
      onClick: () => void;
      icon?: React.FC<{ className?: string }>;
      disabled?: boolean;
      isSeparator?: false;
      isDanger?: boolean;
    }
  | { isSeparator: true };

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
      {/* FIX: Use a more robust type guard ('label' in item) to ensure TypeScript correctly narrows the discriminated union. */}
      {items.map((item, index) => {
        if ('label' in item) {
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
              ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              {item.label}
            </button>
          );
        } else {
          return <div key={index} className="h-px bg-border my-1" />;
        }
      })}
    </div>
  );
};
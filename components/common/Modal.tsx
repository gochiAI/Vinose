import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal = ({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-2xl' }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`bg-surface-darker border border-gray-700 rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200`}>
        <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-surface-darker z-10">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 text-sm">
          {children}
        </div>

        {footer && (
          <div className="p-6 border-t border-gray-700 flex justify-between items-center bg-surface-darker sticky bottom-0 z-10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
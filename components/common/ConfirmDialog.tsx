import React from 'react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  children?: React.ReactNode;
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  children
}: ConfirmDialogProps) => {
  const variantStyles = {
    danger: {
      bg: 'bg-red-900/10',
      border: 'border-red-700/30',
      icon: 'text-red-400',
      button: 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
    },
    warning: {
      bg: 'bg-yellow-900/10',
      border: 'border-yellow-700/30',
      icon: 'text-yellow-400',
      button: 'bg-yellow-600 hover:bg-yellow-700 shadow-yellow-600/20'
    },
    info: {
      bg: 'bg-blue-900/10',
      border: 'border-blue-700/30',
      icon: 'text-blue-400',
      button: 'bg-primary hover:bg-primary-hover shadow-primary/20'
    }
  };

  const styles = variantStyles[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <div></div>
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="px-4 py-2 text-gray-300 hover:bg-white/5 rounded"
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm} 
              className={`px-6 py-2 text-white font-bold rounded shadow-lg ${styles.button}`}
            >
              {confirmText}
            </button>
          </div>
        </>
      }
    >
      <div className="space-y-4">
        <div className={`flex items-center gap-3 p-4 ${styles.bg} border ${styles.border} rounded-lg`}>
          <span className={`material-symbols-outlined ${styles.icon} text-3xl`}>warning</span>
          <div>
            <p className="text-gray-200 font-medium">{message}</p>
            {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
          </div>
        </div>
        {children}
      </div>
    </Modal>
  );
};

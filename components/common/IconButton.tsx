import React from 'react';

interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, onClick, className = '', title, type = 'button' }) => (
  <button type={type} onClick={onClick} className={className} title={title}>
    {icon}
  </button>
);

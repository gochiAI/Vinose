import React from 'react';

interface TopBarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
  title?: string;
  showLabel?: string;
}

export const TopBarButton: React.FC<TopBarButtonProps> = ({ icon, label, onClick, className = '', title, showLabel }) => (
  <button
    onClick={onClick}
    className={className}
    title={title}
  >
    {icon}
    <span className={showLabel ? `hidden ${showLabel}:inline` : ''}>{label}</span>
  </button>
);

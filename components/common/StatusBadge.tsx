import React from 'react';

export type StatusType = 'Draft' | 'Final' | 'Review';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
  showDot?: boolean;
}

export const StatusBadge = ({ status, className = '', showDot = false }: StatusBadgeProps) => {
  const styles: Record<string, string> = {
    Draft: 'bg-secondary/10 text-secondary border-secondary/20',
    Final: 'bg-green-500/10 text-green-500 border-green-500/20',
    Review: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  
  const dotColors: Record<string, string> = {
    Draft: 'bg-secondary',
    Final: 'bg-green-500',
    Review: 'bg-blue-400',
  };

  const statusKey = status as string;
  const style = styles[statusKey] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  const dotColor = dotColors[statusKey] || 'bg-gray-500';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold border ${style} ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>}
      {status}
    </span>
  );
};
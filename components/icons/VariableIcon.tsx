
import React from 'react';

export const VariableIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6h-9a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3ZM12 15H9m3-3H7.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9V7.5" />
    </svg>
);

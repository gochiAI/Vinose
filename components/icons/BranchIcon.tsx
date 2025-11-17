
import React from 'react';

export const BranchIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v4c0 1.105.895 2 2 2h3.586a1 1 0 0 1 .707.293l2.414 2.414a1 1 0 0 0 .707.293H16c1.105 0 2 .895 2 2v4M6 21v-4c0-1.105.895-2 2-2h3.586a1 1 0 0 0 .707-.293l2.414-2.414a1 1 0 0 1 .707-.293H16c1.105 0 2-.895 2-2V7" />
    </svg>
);

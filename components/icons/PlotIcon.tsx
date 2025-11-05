import React from 'react';

export const PlotIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2.25a.75.75 0 0 1 .75.75v.518a7.001 7.001 0 0 1 5.25 6.232c0 2.69-1.458 5.082-3.75 6.232v1.268a.75.75 0 0 1-1.5 0v-1.268A7.001 7.001 0 0 1 6 9.75c0-2.69 1.458-5.082 3.75-6.232V3a.75.75 0 0 1 .75-.75Zm0 15a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75a.75.75 0 0 1 .75-.75Z" />
        <path d="M8.25 12a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Z" />
    </svg>
);

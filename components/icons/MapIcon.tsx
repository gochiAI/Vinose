import React from 'react';

export const MapIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.5-10.5h-7a.5.5 0 0 0-.5.5v11c0 .276.224.5.5.5h7a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 21H9a2.25 2.25 0 0 1-2.25-2.25V5.25A2.25 2.25 0 0 1 9 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 15 21z" />
    </svg>
);
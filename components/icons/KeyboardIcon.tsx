
import React from 'react';

export const KeyboardIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15m0 0a8.25 8.25 0 0 1 15 0zM19.5 12v.01M6.375 20.25a8.25 8.25 0 0 0 11.25 0" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12a9 9 0 0 1 19.5 0v.01a9 9 0 0 1-19.5 0v-.01zM18.75 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z" />
    </svg>
);

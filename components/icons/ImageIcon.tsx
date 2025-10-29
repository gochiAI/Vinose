
import React from 'react';

export const ImageIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06l4.47-4.47a.75.75 0 0 1 1.06 0l3.97 3.97L15.06 12a.75.75 0 0 1 1.06 0l3.97 3.97V6.75A.75.75 0 0 0 19.25 6H4.75a.75.75 0 0 0-.75.75v9.31Z" clipRule="evenodd" />
        <path d="M8.25 10.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
    </svg>
);

import React from 'react';

export const ChatIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.537a59.78 59.78 0 0 1-5.54 0l-3.722-.537C3.347 17.1 2.5 16.136 2.5 15v-4.286c0-.97.616-1.813 1.5-2.097m16.25-1.874A18.726 18.726 0 0 0 12 4.75c-2.796 0-5.482.99-7.5 2.625m15 0c.394 1.482.641 3.033.641 4.625 0 1.592-.247 3.143-.641 4.625m-15 0c-.394-1.482-.641-3.033-.641-4.625 0-1.592.247-3.143.641-4.625" />
    </svg>
);

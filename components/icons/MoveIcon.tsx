import React from 'react';

export const MoveIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25-6-6-6m6 6-6 6m6-6h-4.5m4.5 0v-4.5m-11.25 6h4.5m-4.5 0v4.5m0 0L3 21m6-6-6 6" />
  </svg>
);
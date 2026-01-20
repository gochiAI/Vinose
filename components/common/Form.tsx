import React from 'react';

// Common styles
const inputBase = "w-full bg-surface-dark border border-gray-700 rounded p-2 text-white text-sm focus:border-primary outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const labelBase = "block text-gray-400 text-xs uppercase mb-1 font-bold tracking-wider";

export const Label = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <label className={`${labelBase} ${className}`}>{children}</label>
);

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`${inputBase} ${props.className || ''}`} />
);

export const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className={`${inputBase} resize-none ${props.className || ''}`} />
);

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`${inputBase} ${props.className || ''}`} />
);
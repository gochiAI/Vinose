
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, className, id, ...props }) => {
  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">{label}</label>}
      <textarea
        id={id}
        className={`w-full bg-primary border border-tertiary rounded-md px-3 py-2 text-text-primary placeholder-text-secondary focus:ring-accent focus:border-accent ${className}`}
        {...props}
      />
    </div>
  );
};

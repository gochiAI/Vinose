import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className, id, ...props }) => {
  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>}
      <input
        id={id}
        className={`w-full bg-background border border-border rounded-md px-3 py-2 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none read-only:bg-secondary read-only:cursor-default read-only:focus:ring-0 read-only:border-border disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    </div>
  );
};
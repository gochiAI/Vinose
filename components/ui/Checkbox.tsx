
import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, id, className, ...props }) => {
  return (
    <div className="flex items-center">
      <input
        id={id}
        type="checkbox"
        className={`h-4 w-4 rounded border-border text-primary focus:ring-ring ${className}`}
        {...props}
      />
      <label htmlFor={id} className="ml-2 block text-sm text-foreground select-none">
        {label}
      </label>
    </div>
  );
};

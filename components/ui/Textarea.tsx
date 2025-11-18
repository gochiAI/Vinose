import React, { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, className = '', ...props }, ref) => {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>}
      <textarea
        ref={ref}
        className={`w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none ${className}`}
        {...props}
      />
    </div>
  );
});
Textarea.displayName = 'Textarea';
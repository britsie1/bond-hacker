import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({ children, className, ...props }) => (
  <label 
    className={cn(
      "block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5", 
      className
    )} 
    {...props}
  >
    {children}
  </label>
);

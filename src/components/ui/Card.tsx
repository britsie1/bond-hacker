import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => (
  <div 
    className={cn(
      "bg-[var(--surface)] rounded-3xl p-6 mb-4 shadow-sm border border-[var(--border)] transition-all", 
      className
    )} 
    {...props}
  >
    {children}
  </div>
);

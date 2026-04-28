import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement>, 'prefix'> {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  icon?: React.ReactNode;
  containerClassName?: string;
  isSelect?: boolean;
}

export const Input: React.FC<InputProps> = ({ 
  prefix, 
  suffix, 
  icon, 
  className, 
  containerClassName, 
  isSelect,
  children,
  ...props 
}) => {
  return (
    <div className={cn(
      "relative border-2 border-[var(--border)] rounded-xl bg-[var(--bg)] transition-all overflow-hidden focus-within:border-primary-light focus-within:bg-[var(--surface)] focus-within:ring-4 focus-within:ring-primary/10",
      containerClassName
    )}>
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
          {icon}
        </div>
      )}
      {prefix && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--text-muted)] text-sm pointer-events-none">
          {prefix}
        </div>
      )}
      
      {isSelect ? (
        <select
          className={cn(
            "w-full py-3 px-4 bg-transparent outline-none text-[var(--text)] text-base appearance-none [&>option]:bg-[var(--surface)]",
            icon && "pl-11",
            prefix && "pl-8",
            suffix && "pr-10",
            className
          )}
          {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
        >
          {children}
        </select>
      ) : (
        <input
          className={cn(
            "w-full py-3 px-4 bg-transparent outline-none text-[var(--text)] text-base appearance-none",
            icon && "pl-11",
            prefix && "pl-8",
            suffix && "pr-10",
            className
          )}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {suffix && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[var(--text-muted)] text-sm pointer-events-none">
          {suffix}
        </div>
      )}
    </div>
  );
};

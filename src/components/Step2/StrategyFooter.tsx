import React from 'react';
import { createPortal } from 'react-dom';
import { ChartLine } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StrategyFooterProps {
  moneySaved: number;
  yearsSaved: number;
  monthsSaved: number;
  onNext: () => void;
  canContinue: boolean;
  show: boolean;
}

export const StrategyFooter: React.FC<StrategyFooterProps> = ({
  moneySaved,
  yearsSaved,
  monthsSaved,
  onNext,
  canContinue,
  show
}) => {
  if (!show) return null;

  return createPortal(
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-[var(--surface)] border-t border-[var(--border)] shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.1)] backdrop-blur-lg bg-opacity-90 dark:bg-opacity-90">
      <div className="max-w-[440px] mx-auto flex items-center justify-around gap-2">
        <div className="text-center">
          <div className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">Savings</div>
          <div className="text-lg font-black text-success leading-none">
            R {Math.round(moneySaved).toLocaleString('en-ZA')}
          </div>
        </div>
        
        <div className="text-center">
           <div className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">Time Saved</div>
           <div className="text-lg font-black text-primary-light leading-none">
              {yearsSaved > 0 ? `${yearsSaved}y ` : ''}{monthsSaved > 0 ? `${monthsSaved}m` : (yearsSaved === 0 ? '0m' : '')}
           </div>
        </div>
        
        <button 
          onClick={onNext} 
          className={cn(
            "p-3 rounded-2xl text-[var(--text-secondary)] hover:text-primary transition-all hover:bg-primary/10 active:scale-90 flex-shrink-0",
            !canContinue && "opacity-20 grayscale pointer-events-none"
          )}
          aria-label="Visualize comparison"
        >
          <ChartLine size={28} />
        </button>
      </div>
    </div>,
    document.body
  );
};

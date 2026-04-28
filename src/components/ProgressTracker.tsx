import React from 'react';
import { Check, Sun, Moon, ChevronLeft } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProgressTrackerProps {
  currentStep: number;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onBack: () => void;
}

const steps = [
  { id: 1, label: 'Details' },
  { id: 2, label: 'Scenarios' },
  { id: 3, label: 'Compare' },
];

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ 
  currentStep, 
  isDarkMode, 
  toggleDarkMode,
  onBack
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[var(--surface)] p-3 shadow-sm border-b border-[var(--border)]">
      <div className="max-w-[500px] mx-auto flex items-center justify-between px-2">
        {/* Back Button */}
        <div className="w-10">
          {currentStep > 1 && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-primary transition-all hover:bg-primary/5 active:scale-90"
              aria-label="Go back"
            >
              <ChevronLeft size={24} />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2",
                    currentStep === step.id
                      ? "bg-primary border-primary-light text-white shadow-[0_0_0_4px_rgba(15,118,110,0.15)]"
                      : currentStep > step.id
                      ? "bg-success border-success text-white"
                      : "bg-[var(--border)] border-transparent text-[var(--text-muted)]"
                  )}
                >
                  {currentStep > step.id ? <Check size={16} /> : step.id}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-6 sm:w-10 h-[2px] transition-all",
                    currentStep > step.id ? "bg-success" : "bg-[var(--border)]"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Theme Toggle */}
        <div className="w-10 flex justify-end">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-primary transition-all hover:bg-primary/5 active:scale-90"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

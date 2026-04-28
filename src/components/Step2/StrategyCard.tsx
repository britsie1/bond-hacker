import React from 'react';
import { Calendar, Check, type LucideIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatCurrency, formatTimeSaved } from '../../utils/formatters';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface StrategyUI {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  desc: string;
  canSolve: boolean;
}

interface StrategyCardProps {
  strategy: StrategyUI;
  isSelected: boolean;
  onToggle: (id: string) => void;
  targetDate?: string;
  onClearTarget: (id: string) => void;
  openPicker: (id: string) => void;
  children: React.ReactNode;
  moneySaved?: number;
  monthsSaved?: number;
}

export const StrategyCard: React.FC<StrategyCardProps> = ({
  strategy: s,
  isSelected,
  onToggle,
  targetDate,
  onClearTarget,
  openPicker,
  children,
  moneySaved,
  monthsSaved
}) => {
  const hasTarget = !!targetDate;

  return (
    <div
      onClick={() => { if (!isSelected) onToggle(s.id); }}
      className={cn(
        "group relative bg-[var(--surface)] border-2 rounded-2xl p-5 transition-all overflow-hidden shadow-sm cursor-pointer",
        isSelected 
          ? "border-primary bg-gradient-to-br from-primary/[0.03] to-primary-light/[0.05]" 
          : "border-[var(--border)] hover:border-primary-light hover:-translate-y-0.5"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-xl", s.bg, s.color)}>
            <s.icon size={22} />
          </div>
          <div>
            <div className="font-extrabold text-base text-[var(--text)]">{s.title}</div>
            <div className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider">{s.subtitle}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Styled Checkbox - Only this can deselect/collapse */}
          <div 
            onClick={(e) => { e.stopPropagation(); onToggle(s.id); }}
            className={cn(
              "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer active:scale-90",
              isSelected ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "border-[var(--border)] bg-[var(--bg)] hover:border-primary-light"
            )}
          >
            {isSelected && <Check size={16} strokeWidth={4} />}
          </div>
        </div>
      </div>

      <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">{s.desc}</p>
      
      {isSelected && (
        <div className="pt-4 border-t border-[var(--border)] animate-in slide-in-from-top-2 duration-300">
          <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-1">
                <div className="flex-1">
                  {children}
                </div>
             </div>
             
             {s.canSolve && (
                <div className="flex justify-between items-center pt-2">
                  <div className="relative">
                    <button 
                      onClick={() => openPicker(s.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all border font-bold text-[10px] tracking-tight",
                        hasTarget 
                          ? "bg-primary text-white border-primary shadow-md" 
                          : "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                      )}
                    >
                      <Calendar size={12} />
                      {hasTarget ? `TARGET: ${targetDate}` : "SET TARGET DATE"}
                    </button>
                  </div>
                  
                  {hasTarget && (
                    <button 
                      onClick={() => onClearTarget(s.id)}
                      className="text-[9px] font-bold text-primary hover:underline uppercase tracking-tighter"
                    >
                      Clear Target
                    </button>
                  )}
                </div>
             )}
             
             {(moneySaved !== undefined || monthsSaved !== undefined) && (
               <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--border)] border-dashed">
                 <div className="flex flex-col">
                   <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Money Saved</span>
                   <span className="text-sm font-extrabold text-success">
                     {moneySaved && moneySaved > 0 ? formatCurrency(moneySaved) : 'R0'}
                   </span>
                 </div>
                 <div className="flex flex-col text-right">
                   <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Time Saved</span>
                   <span className="text-sm font-extrabold text-primary">
                     {monthsSaved && monthsSaved > 0 ? formatTimeSaved(monthsSaved) || '0 months' : '0 months'}
                   </span>
                 </div>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

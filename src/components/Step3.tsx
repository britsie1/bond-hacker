import React, { useMemo } from 'react';
import { RotateCcw, ListChecks, TrendingDown, Share, Printer } from 'lucide-react';
import { SummaryCard } from './Step3/SummaryCard';
import { ComparisonChart } from './Step3/ComparisonChart';
import { ProTips } from './Step3/ProTips';
import { Card } from './ui/Card';
import type { LoanInputs, StrategyResult } from '../hooks/useBondState';
import { formatCurrency } from '../utils/formatters';
import { format, addMonths } from 'date-fns';

interface Step3Props {
  onReset: () => void;
  inputs: LoanInputs;
  results: StrategyResult[];
}

export interface ChartEntry {
  month: number;
  date: string;
  [key: string]: string | number;
}

export const Step3: React.FC<Step3Props> = ({ onReset, inputs, results }) => {
  const baselineResult = results.find(r => r.strategy.id === 'baseline');
  
  const chartData = useMemo(() => {
    const maxMonths = Math.max(...results.map(r => r.result.schedule.length));
    if (maxMonths === 0) return [];

    const data: ChartEntry[] = [];
    const step = maxMonths > 120 ? 12 : 3; // Coarser steps for mobile-first

    for (let i = 0; i <= maxMonths; i += step) {
      const currentMonth = Math.min(i, maxMonths - 1);
      if (currentMonth < 0) break;

      const entry: ChartEntry = { 
        month: currentMonth, 
        date: format(addMonths(inputs.startDate, currentMonth), 'MMM yy') 
      };
      
      results.forEach(r => {
        const strategyName = r.strategy.name;
        const schedule = r.result.schedule;
        if (currentMonth < schedule.length) {
          entry[strategyName] = Math.round(schedule[currentMonth].closingBalance);
        }
      });

      data.push(entry);
    }
    return data;
  }, [results, inputs.startDate]);

  return (
    <div className="pb-10">
      <div className="text-center py-6">
        <h1 className="text-2xl font-extrabold mb-2 text-[var(--text)]">Your payoff journey</h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-[320px] mx-auto">
          See how your strategies stack up against the baseline.
        </p>

        <div className="flex items-center justify-center gap-3 mt-6">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-primary hover:border-primary transition-all font-bold text-xs shadow-sm active:scale-95">
            <Share size={16} />
            Share
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-primary hover:border-primary transition-all font-bold text-xs shadow-sm active:scale-95"
          >
            <Printer size={16} />
            Print Report
          </button>
        </div>
      </div>

      <SummaryCard result={baselineResult?.result} />
      
      <ComparisonChart 
        chartData={chartData} 
        strategies={results.map(r => r.strategy)} 
        results={results}
      />

      <Card>
         <div className="flex items-center gap-2 mb-5 font-bold text-base text-[var(--text)]">
            <ListChecks className="text-primary w-5 h-5" />
            Strategy Comparison
         </div>
         
         <div className="space-y-3">
            {results.filter(r => r.strategy.id !== 'baseline').map(r => {
                const interestSaved = (baselineResult?.result.totalInterest || 0) - r.result.totalInterest;
                const timeSaved = (baselineResult?.result.totalMonths || 0) - r.result.totalMonths;

                return (
                    <div key={r.strategy.id} className="flex items-center gap-3 p-4 border-2 border-[var(--border)] rounded-2xl">
                       <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${r.strategy.color}10`, color: r.strategy.color }}>
                          <TrendingDown size={18} />
                       </div>
                       <div className="flex-1">
                          <div className="font-bold text-sm text-[var(--text)]">{r.strategy.name}</div>
                          <div className="text-[11px] text-[var(--text-muted)] font-semibold">
                            Payoff by {format(r.result.payoffDate, 'MMM yyyy')} • {timeSaved > 0 ? `${timeSaved} mths earlier` : 'same term'}
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="font-bold text-sm text-success">{formatCurrency(interestSaved)}</div>
                          <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase">saved</div>
                       </div>
                    </div>
                );
            })}
         </div>
      </Card>

      <ProTips />

      <button onClick={onReset} className="btn-secondary w-full mt-8">
        <RotateCcw size={18} />
        Start Over
      </button>
    </div>
  );
};

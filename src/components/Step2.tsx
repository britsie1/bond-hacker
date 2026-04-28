import React, { useMemo, useRef } from 'react';
import { TrendingUp, Coins, MoveUp, Wallet, Lightbulb, ChartLine, Calendar, Banknote } from 'lucide-react';
import { cn } from '../lib/utils';
import { BaselineSummary } from './Step2/BaselineSummary';
import { StrategyCard, type StrategyUI } from './Step2/StrategyCard';
import { StrategyAdjuster } from './Step2/StrategyAdjuster';
import { StrategyFooter } from './Step2/StrategyFooter';

import type { Strategy, StrategyResult, LoanInputs } from '../hooks/useBondState';

interface Step2Props {
  onNext: () => void;
  isNewLoan: boolean;
  isActive: boolean;
  inputs: LoanInputs;
  strategies: Strategy[];
  results: StrategyResult[];
  toggleStrategy: (id: string, name: string, color: string) => void;
  updateStrategy: (id: string, updates: Partial<Strategy>) => void;
}

const baseStrategies = [
  { id: 'debit', title: 'Early Debit Order', subtitle: 'Timing Optimization', icon: Calendar, color: '#f97316', bg: 'bg-orange-500/10', desc: 'Move your payment date closer to your payday to reduce the daily interest balance.', canSolve: false },
  { id: 'negotiate', title: 'Rate Renegotiation', subtitle: 'Structural Savings', icon: TrendingUp, color: '#a855f7', bg: 'bg-purple-500/10', desc: 'Lower your interest rate by asking your bank for a better deal based on your history.', canSolve: false },
  { id: 'fixed', title: 'Fixed Installment', subtitle: 'Cash Flow Stability', icon: Banknote, color: '#2563eb', bg: 'bg-blue-600/10', desc: 'Commit to a total monthly outflow. If rates drop, your "extra" payment grows automatically.', canSolve: true },
  { id: 'boost', title: 'Monthly Boost', subtitle: 'Consistent Extra Payments', icon: TrendingUp, color: '#10b981', bg: 'bg-success/10', desc: 'Add a fixed amount to your monthly debit order. Small, early extras are the most effective.', canSolve: true },
  { id: 'escalate', title: 'Annual Escalation', subtitle: 'Inflation-Linked Growth', icon: MoveUp, color: '#3b82f6', bg: 'bg-blue-500/10', desc: 'Grow your extra payments by a % each year, matching your annual salary increases.', canSolve: true },
  { id: 'lump', title: 'Strategic Lump Sums', subtitle: 'Bonus or Tax Windfalls', icon: Coins, color: '#f59e0b', bg: 'bg-secondary/10', desc: 'Inject once-off or annual lump sums like a 13th check or SARS refund into your bond.', canSolve: false },
  { id: 'access', title: 'Access Bond Hack', subtitle: 'Interest Offset Flow', icon: Wallet, color: '#0f766e', bg: 'bg-primary/10', desc: 'Use your bond as your main savings account. Deposit your full salary to minimize daily interest.', canSolve: false },
];

const newPurchaseStrategy = { 
  id: 'upfront', 
  title: 'Pay Costs in Cash', 
  subtitle: 'New Purchase Win', 
  icon: Banknote, 
  color: '#d97706', 
  bg: 'bg-amber-600/10', 
  desc: 'Don\'t add attorney fees or transfer duty to your bond. Pay them in cash to avoid 20 years of interest.', 
  canSolve: false 
};

export const Step2: React.FC<Step2Props> = ({ 
  onNext, 
  isNewLoan, 
  isActive,
  inputs,
  strategies,
  results,
  toggleStrategy,
  updateStrategy
}) => {
  const dateInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const availableStrategies = useMemo(() => {
    const list = [...baseStrategies];
    if (isNewLoan) {
      list.unshift(newPurchaseStrategy);
    }
    return list;
  }, [isNewLoan]);

  const totals = useMemo(() => {
    const baselineResult = results.find(r => r.strategy.id === 'baseline');
    if (!baselineResult || results.length <= 1) return { money: 0, years: 0, months: 0 };
    
    // Use the combined result if multiple strategies are selected, otherwise use the best single one
    const combinedResult = results.find(r => r.strategy.id === 'combined');
    const bestResult = combinedResult || results.reduce((prev, curr) => 
      (curr.result.totalInterest < prev.result.totalInterest) ? curr : prev
    , baselineResult);

    const money = Math.max(0, baselineResult.result.totalInterest - bestResult.result.totalInterest);
    const totalSavedMonths = Math.max(0, baselineResult.result.totalMonths - bestResult.result.totalMonths);
    
    return { money, years: Math.floor(totalSavedMonths / 12), months: totalSavedMonths % 12 };
  }, [results]);

  const baselineResult = results.find(r => r.strategy.id === 'baseline');

  const openPicker = (id: string) => {
    const input = dateInputRefs.current[id];
    if (input) {
      if ('showPicker' in HTMLInputElement.prototype) {
        input.showPicker();
      } else {
        input.click();
      }
    }
  };

  return (
    <div className="pb-40">
      <div className="text-center py-6">
        <h1 className="text-2xl font-extrabold mb-2 text-[var(--text)]">Pick your strategy</h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-[320px] mx-auto">
          Choose one or more strategies to see how much you could save.
        </p>
      </div>

      <BaselineSummary result={baselineResult?.result} />

      <div className="flex items-center gap-2 mb-4 font-bold text-sm text-[var(--text)]">
        <Lightbulb className="text-secondary w-4 h-4" />
        Select a strategy:
      </div>

      <div className="space-y-3">
        {availableStrategies.map((s) => {
          const activeStrategy = strategies.find(exist => exist.id === s.id);
          const activeResult = results.find(r => r.strategy.id === s.id);
          const isSelected = !!activeStrategy?.enabled;

          let moneySaved = undefined;
          let monthsSaved = undefined;
          
          if (isSelected && baselineResult && activeResult) {
            moneySaved = Math.max(0, baselineResult.result.totalInterest - activeResult.result.totalInterest);
            monthsSaved = Math.max(0, baselineResult.result.totalMonths - activeResult.result.totalMonths);
          }

          return (
            <React.Fragment key={s.id}>
              <StrategyCard
                strategy={s as StrategyUI}
                isSelected={isSelected}
                onToggle={() => toggleStrategy(s.id, s.title, s.color)}
                targetDate={activeStrategy?.targetPayoffDate}
                onClearTarget={() => updateStrategy(s.id, { targetPayoffDate: undefined })}
                openPicker={() => openPicker(s.id)}
                moneySaved={moneySaved}
                monthsSaved={monthsSaved}
              >
                <StrategyAdjuster
                  id={s.id}
                  hasTarget={!!activeStrategy?.targetPayoffDate}
                  activeStrategy={activeStrategy}
                  updateStrategy={updateStrategy}
                  inputs={inputs}
                  solvedValue={activeResult?.solvedValue}
                />
              </StrategyCard>              <input 
                ref={el => { dateInputRefs.current[s.id] = el; }}
                type="month" 
                className="absolute opacity-0 w-0 h-0 pointer-events-none" 
                onChange={(e) => updateStrategy(s.id, { targetPayoffDate: e.target.value })}
              />
            </React.Fragment>
          );
        })}
      </div>

      <div className="mt-8 px-1 pb-4">
        <button 
          onClick={onNext}
          className={cn(
            "btn-primary w-full py-4 text-base shadow-lg shadow-primary/20",
            strategies.length <= 1 && "opacity-50 grayscale pointer-events-none"
          )}
        >
          <ChartLine size={20} />
          Visualize Comparison
        </button>
      </div>

      <StrategyFooter 
        moneySaved={totals.money}
        yearsSaved={totals.years}
        monthsSaved={totals.months}
        onNext={onNext}
        canContinue={strategies.length > 1}
        show={isActive}
      />
    </div>
  );
};

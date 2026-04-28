import React from 'react';
import { Lightbulb, TrendingUp, Calendar, RefreshCcw, Zap } from 'lucide-react';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { NumericInput } from '../Step1/NumericInput';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../utils/formatters';
import { calculatePropertyCosts } from '../../utils/costCalculators';

import type { Strategy } from '../../utils/urlState';
import type { LoanInputs } from '../../utils/loanMath';

interface StrategyAdjusterProps {
  id: string;
  hasTarget: boolean;
  activeStrategy: Strategy | undefined;
  updateStrategy: (id: string, updates: Partial<Strategy>) => void;
  inputs: LoanInputs;
  solvedValue?: number;
}

export const StrategyAdjuster: React.FC<StrategyAdjusterProps> = ({ id, hasTarget, activeStrategy, updateStrategy, inputs, solvedValue }) => {
  if (!activeStrategy) return null;

  if (id === 'debit') {
    const payDay = activeStrategy.payDay || 25;
    const currentDebitDay = activeStrategy.currentDebitDay || 1;
    const debitOrderDay = activeStrategy.debitOrderDay || 1;

    // Calculate days in between
    const getDaysInBetween = (start: number, end: number) => {
      const days = [];
      let current = (start % 31) + 1;
      while (current !== end) {
        days.push(current);
        current = (current % 31) + 1;
        if (days.length > 31) break; // Safety break
      }
      return days;
    };

    const inBetweenDays = getDaysInBetween(payDay, currentDebitDay);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>The day you get paid</Label>
            <Input 
              isSelect 
              value={payDay} 
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateStrategy(id, { payDay: Number(e.target.value) })}
              className="py-2 text-sm"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </Input>
          </div>
          <div>
            <Label>Your current payment day</Label>
            <Input 
              isSelect 
              value={currentDebitDay} 
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateStrategy(id, { currentDebitDay: Number(e.target.value) })}
              className="py-2 text-sm"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </Input>
          </div>
        </div>
        <div>
          <Label>New Early Payment Day</Label>
          <Input 
            isSelect 
            value={inBetweenDays.includes(debitOrderDay) ? debitOrderDay : (inBetweenDays[0] || currentDebitDay)} 
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateStrategy(id, { debitOrderDay: Number(e.target.value) })}
            className="py-2 text-sm"
            disabled={inBetweenDays.length === 0}
          >
            {inBetweenDays.length === 0 && <option value={currentDebitDay}>No days in between</option>}
            {inBetweenDays.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </Input>
          <p className="text-[10px] text-[var(--text-muted)] mt-1 italic">
            * Select a day between your payday and your current debit order day.
          </p>
        </div>
        <div className="bg-orange-500/5 rounded-2xl p-4 border border-orange-500/10 text-[11px] leading-relaxed text-[var(--text-secondary)]">
          <div className="flex gap-2 mb-1 text-orange-700 dark:text-orange-400">
            <Calendar size={14} className="shrink-0" />
            <p className="font-bold uppercase tracking-tight">The Timing Hack</p>
          </div>
          <p>
            By moving your payment to just after payday, you reduce the time interest accumulates on your full balance. This "small" change can save you thousands over the loan term.
          </p>
        </div>
      </div>
    );
  }

  if (id === 'access') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Monthly Salary</Label>
            <NumericInput prefix="R" value={activeStrategy.salaryAmount || 0} onChange={(val) => updateStrategy(id, { salaryAmount: val })} className="py-2 text-sm" />
          </div>
          <div>
            <Label>Monthly Spend</Label>
            <NumericInput prefix="R" value={activeStrategy.salarySpent || 0} onChange={(val) => updateStrategy(id, { salarySpent: val })} className="py-2 text-sm" />
          </div>
        </div>
        <div>
          <Label>Available Savings</Label>
          <NumericInput prefix="R" value={activeStrategy.savings || 0} onChange={(val) => updateStrategy(id, { savings: val })} />
        </div>
        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
          <div className="flex items-start gap-3 text-xs text-[var(--text-secondary)] leading-relaxed">
            <Lightbulb size={16} className="text-primary shrink-0 mt-0.5" />
            <p>Every day your salary sits in your bond, it acts as a <b>100% tax-free</b> investment equal to your interest rate.</p>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'negotiate') {
    const currentRate = inputs.interestRate;
    const selectedRate = activeStrategy.interestRate || currentRate;
    const reduction = Math.max(0, currentRate - selectedRate);

    return (
      <div className="space-y-4">
        <div>
          <Label>Interest Rate Reduction</Label>
          <div className="flex gap-2 mb-3">
            {[0.25, 0.5, 0.75, 1.0].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => updateStrategy(id, { interestRate: currentRate - val })}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all",
                  Math.abs(reduction - val) < 0.01
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-[var(--border)] hover:border-primary/50 text-[var(--text-muted)]"
                )}
              >
                -{val}%
              </button>
            ))}
          </div>
          <Label className="text-[10px] opacity-70">New Interest Rate</Label>
          <NumericInput 
            suffix="%" 
            value={selectedRate} 
            onChange={(val) => updateStrategy(id, { interestRate: val })}
            decimals={2}
          />
        </div>
        <div className="bg-purple-500/5 rounded-2xl p-4 border border-purple-500/10 text-[11px] space-y-2">
          <div className="flex gap-2">
            <TrendingUp size={14} className="text-purple-500 shrink-0" />
            <p className="font-bold uppercase tracking-tight text-purple-700 dark:text-purple-400">Negotiation Tip:</p>
          </div>
          <p className="text-[var(--text-secondary)]">Lowering your rate by just 0.5% can save you hundreds of thousands over 20 years. Ask your bank to match a competitor's offer.</p>
        </div>
      </div>
    );
  }

  if (id === 'upfront') {
    const costs = calculatePropertyCosts(inputs.loanAmount, inputs.currentOutstanding);
    const attorneyFees = costs.conveyancingFees + costs.bondRegistrationFees + costs.vatOnFees;
    const totalFees = costs.bankInitiationFee + costs.transferDuty + attorneyFees;

    return (
      <div className="space-y-4">
        <div className="bg-[var(--bg)] rounded-2xl p-4 border border-[var(--border)]">
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={!!activeStrategy.payInitiationFee}
                  onChange={(e) => updateStrategy(id, { payInitiationFee: e.target.checked })}
                  className="w-5 h-5 rounded-md border-2 border-[var(--border)] text-primary focus:ring-primary accent-primary"
                />
                <span className="text-sm font-medium text-[var(--text)] group-hover:text-primary transition-colors">Initiation Fee</span>
              </div>
              <span className="text-sm font-bold text-[var(--text-secondary)]">{formatCurrency(costs.bankInitiationFee)}</span>
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={!!activeStrategy.payTransferCosts}
                  onChange={(e) => updateStrategy(id, { payTransferCosts: e.target.checked })}
                  className="w-5 h-5 rounded-md border-2 border-[var(--border)] text-primary focus:ring-primary accent-primary"
                />
                <span className="text-sm font-medium text-[var(--text)] group-hover:text-primary transition-colors">Transfer and Registration Costs</span>
              </div>
              <span className="text-sm font-bold text-[var(--text-secondary)]">{formatCurrency(costs.transferDuty)}</span>
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={!!activeStrategy.payAttorneyFees}
                  onChange={(e) => updateStrategy(id, { payAttorneyFees: e.target.checked })}
                  className="w-5 h-5 rounded-md border-2 border-[var(--border)] text-primary focus:ring-primary accent-primary"
                />
                <span className="text-sm font-medium text-[var(--text)] group-hover:text-primary transition-colors">Attorney Fees</span>
              </div>
              <span className="text-sm font-bold text-[var(--text-secondary)]">{formatCurrency(attorneyFees)}</span>
            </label>
          </div>
          
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Upfront Costs</span>
            <span className="text-base font-black text-primary">{formatCurrency(totalFees)}</span>
          </div>
        </div>

        <div className="bg-amber-600/5 rounded-2xl p-4 border border-amber-600/10 text-[11px] leading-relaxed text-[var(--text-secondary)] space-y-2">
          <div className="flex gap-2 mb-1 text-amber-700 dark:text-amber-500">
            <Lightbulb size={14} className="shrink-0" />
            <p className="font-bold uppercase tracking-tight">The Math Explained</p>
          </div>
          <p>
            If you roll these costs into your bond, you still pay the full amount back, <b>plus 20 years of interest on top of it.</b>
          </p>
          <p>
            By paying cash upfront, the "Money Saved" shown is <b>purely the avoided interest</b>. You pay the base fee amount either way, but this strategy stops the bank from charging you interest on your fees!
          </p>
        </div>
      </div>
    );
  }

  if (id === 'lump') {
    const frequency = activeStrategy.lumpSums[0]?.frequency || 'once';
    return (
      <div className="space-y-4">
        <div className="p-1 bg-[var(--bg)] rounded-2xl border-2 border-[var(--border)] flex">
          <button 
            type="button"
            onClick={() => updateStrategy(id, { lumpSums: [{ monthIndex: 12, amount: activeStrategy.lumpSums[0]?.amount || 0, frequency: 'once' }] })}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all",
              frequency === 'once' ? "bg-[var(--surface)] text-primary shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            <Zap size={14} />
            ONCE-OFF
          </button>
          <button 
            type="button"
            onClick={() => updateStrategy(id, { lumpSums: [{ monthIndex: 12, amount: activeStrategy.lumpSums[0]?.amount || 0, frequency: 'annual' }] })}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all",
              frequency === 'annual' ? "bg-[var(--surface)] text-primary shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            <RefreshCcw size={14} />
            ANNUAL
          </button>
        </div>

        <div>
          <Label>{frequency === 'annual' ? 'Annual Lump Sum (Every Month 12)' : 'Once-off Lump Sum (Month 12)'}</Label>
          <NumericInput 
            prefix="R" 
            value={activeStrategy.lumpSums[0]?.amount || 0} 
            onChange={(val) => updateStrategy(id, { lumpSums: [{ monthIndex: 12, amount: val, frequency }] })}
          />
        </div>
      </div>
    );
  }

  if (id === 'fixed') {
    return (
      <div className="space-y-4">
        <div>
          <Label>Fixed Monthly Target</Label>
          <NumericInput 
            prefix="R" 
            value={activeStrategy.fixedMonthlyPayment || 0} 
            onChange={(val) => updateStrategy(id, { fixedMonthlyPayment: val })}
          />
        </div>
      </div>
    );
  }

  const label = hasTarget ? 'Auto-Solved Value' : (id === 'boost' ? 'Extra Monthly Amount' : id === 'escalate' ? 'Annual Increase %' : 'Adjustment Value');
  const valueKey = id === 'escalate' ? 'annualExtraIncrement' : 'extraMonthlyPayment';
  const displayValue = hasTarget && solvedValue !== undefined ? solvedValue : (activeStrategy[valueKey as keyof Strategy] as number);

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <NumericInput 
        prefix={id !== 'escalate' ? "R" : undefined} 
        suffix={id === 'escalate' ? "%" : undefined} 
        value={displayValue || 0} 
        onChange={(val) => updateStrategy(id, { [valueKey]: val, targetPayoffDate: undefined })} 
      />
      <p className="text-[9px] text-[var(--text-muted)] mt-1.5 italic">
        {hasTarget ? "* Manually adjusting clears the target date." : (id === 'boost' || id === 'escalate') ? "✨ Tip: Use 'SET TARGET DATE' to solve for a specific month." : ""}
      </p>
    </div>
  );
};

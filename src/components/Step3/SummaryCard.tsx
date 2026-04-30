import React from 'react';
import { format } from 'date-fns';
import type { LoanResult } from '../../utils/loanMath';
import { formatCurrency } from '../../utils/formatters';

interface SummaryCardProps {
  result?: LoanResult;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ result }) => {
  if (!result) return null;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 text-[var(--text)] mb-6 shadow-sm">
      <div className="text-[10px] uppercase opacity-60 text-[var(--text-muted)] tracking-[0.2em] font-bold mb-4">Baseline Overview</div>
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-[var(--border)] pb-3 text-[var(--text)]">
          <span className="text-sm opacity-80 text-[var(--text-secondary)]">Original Payoff</span>
          <span className="font-bold text-base text-[var(--text)]">{format(result.payoffDate, 'MMM yyyy')}</span>
        </div>
        <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
          <span className="text-sm opacity-80 text-[var(--text-secondary)]">Total Interest</span>
          <span className="font-bold text-base text-primary">{formatCurrency(result.totalInterest)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm opacity-80 text-[var(--text-secondary)]">Monthly Payment</span>
          <span className="font-bold text-base text-[var(--text)]">
            {formatCurrency(result.schedule[0]?.payment + result.totalServiceFees / result.totalMonths + result.totalAssurance / result.totalMonths + result.totalInsurance / result.totalMonths)}
          </span>
        </div>
      </div>
    </div>
  );
};

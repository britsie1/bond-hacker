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
    <div className="bg-slate-900 rounded-3xl p-6 text-white mb-6 shadow-xl">
      <div className="text-[10px] uppercase opacity-60 tracking-[0.2em] font-bold mb-4">Baseline Overview</div>
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-white/10 pb-3 text-white">
          <span className="text-sm opacity-80">Original Payoff</span>
          <span className="font-bold text-base text-white">{format(result.payoffDate, 'MMM yyyy')}</span>
        </div>
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <span className="text-sm opacity-80 text-white">Total Interest</span>
          <span className="font-bold text-base text-secondary">{formatCurrency(result.totalInterest)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm opacity-80 text-white">Monthly Payment</span>
          <span className="font-bold text-base text-white">
            {formatCurrency(result.schedule[0]?.payment + result.totalServiceFees / result.totalMonths + result.totalAssurance / result.totalMonths + result.totalInsurance / result.totalMonths)}
          </span>
        </div>
      </div>
    </div>
  );
};

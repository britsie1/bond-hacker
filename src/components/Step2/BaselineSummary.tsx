import React from 'react';
import { format } from 'date-fns';
import type { LoanResult } from '../../utils/loanMath';
import { formatCurrency } from '../../utils/formatters';

interface BaselineSummaryProps {
  result?: LoanResult;
}

export const BaselineSummary: React.FC<BaselineSummaryProps> = ({ result }) => {
  if (!result) return null;

  return (
    <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-6 text-white mb-6 shadow-xl shadow-primary/20">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-extrabold text-white">
            {formatCurrency(
              (result.schedule[0]?.payment || 0) + 
              (result.schedule[0]?.assurance || 0) + 
              (result.schedule[0]?.insurance || 0) + 
              (result.totalServiceFees / result.totalMonths)
            )}
          </div>
          <div className="text-[10px] uppercase opacity-80 tracking-widest font-bold">Monthly Payment</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-extrabold text-white">
            R {( (result.totalInterest + result.totalServiceFees + result.totalAssurance + result.totalInsurance) / 1000000 ).toFixed(1)}M
          </div>
          <div className="text-[10px] uppercase opacity-80 tracking-widest font-bold">Total Cost</div>
        </div>
        <div className="col-span-2 h-[1px] bg-white/20 my-1" />
        <div className="text-center">
          <div className="text-2xl font-extrabold text-white">
            R {(result.totalInterest / 1000000).toFixed(1)}M
          </div>
          <div className="text-[10px] uppercase opacity-80 tracking-widest font-bold">Total Interest</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-extrabold text-white">
            {format(result.payoffDate, 'MMM yyyy')}
          </div>
          <div className="text-[10px] uppercase opacity-80 tracking-widest font-bold">Payoff Date</div>
        </div>
      </div>
    </div>
  );
};

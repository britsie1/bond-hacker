import React from 'react';
import { createPortal } from 'react-dom';
import type { LoanInputs, StrategyResult } from '../../hooks/useBondState';
import { formatCurrency } from '../../utils/formatters';
import { format } from 'date-fns';

interface PdfReportProps {
  inputs: LoanInputs;
  results: StrategyResult[];
  baselineResult?: StrategyResult;
}

export const PdfReport: React.FC<PdfReportProps> = ({ inputs, results, baselineResult }) => {
  return createPortal(
    <div id="print-root" className="hidden print:block bg-white text-black p-8 min-h-screen font-sans">
      <div className="border-b-2 border-slate-200 pb-4 mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bond Hacker Strategy Report</h1>
        <p className="text-sm text-slate-500 mt-1">Generated on {format(new Date(), 'dd MMM yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-10">
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-3 border-b border-slate-100 pb-1">Loan Details</h2>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between"><span>Outstanding Balance:</span> <span className="font-semibold text-slate-900">{formatCurrency(inputs.currentOutstanding)}</span></div>
            <div className="flex justify-between"><span>Interest Rate:</span> <span className="font-semibold text-slate-900">{inputs.interestRate.toFixed(2)}%</span></div>
            <div className="flex justify-between"><span>Remaining Term:</span> <span className="font-semibold text-slate-900">{inputs.remainingTermYears}y {inputs.remainingTermMonths}m</span></div>
          </div>
        </div>

        {baselineResult && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-3 border-b border-slate-100 pb-1">Baseline Projection</h2>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between"><span>Original Payoff Date:</span> <span className="font-semibold text-slate-900">{format(baselineResult.result.payoffDate, 'MMM yyyy')}</span></div>
              <div className="flex justify-between"><span>Total Interest:</span> <span className="font-semibold text-slate-900">{formatCurrency(baselineResult.result.totalInterest)}</span></div>
              <div className="flex justify-between">
                <span>Est. Monthly Payment:</span> 
                <span className="font-semibold text-slate-900">
                  {formatCurrency(baselineResult.result.schedule[0]?.payment + baselineResult.result.totalServiceFees / baselineResult.result.totalMonths + baselineResult.result.totalAssurance / baselineResult.result.totalMonths + baselineResult.result.totalInsurance / baselineResult.result.totalMonths)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-8">
         <h2 className="text-xl font-bold text-slate-800 mb-4 border-b-2 border-slate-200 pb-2">Strategy Comparison</h2>
         <table className="w-full text-left text-sm border-collapse">
           <thead>
             <tr className="border-b-2 border-slate-300 text-slate-700">
               <th className="pb-2 pt-2 font-bold w-1/3">Strategy</th>
               <th className="pb-2 pt-2 font-bold text-right">Payoff Date</th>
               <th className="pb-2 pt-2 font-bold text-right">Time Saved</th>
               <th className="pb-2 pt-2 font-bold text-right">Interest Saved</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {results.map((r) => {
               const isBaseline = r.strategy.id === 'baseline';
               const interestSaved = baselineResult ? baselineResult.result.totalInterest - r.result.totalInterest : 0;
               const timeSaved = baselineResult ? baselineResult.result.totalMonths - r.result.totalMonths : 0;
               
               return (
                 <tr key={r.strategy.id} className={isBaseline ? "bg-slate-50" : ""}>
                   <td className="py-4 pr-4">
                     <div className="font-bold text-slate-900 text-base">{r.strategy.name}</div>
                     {r.strategy.subtitle && <div className="text-xs text-slate-500 mt-0.5">{r.strategy.subtitle}</div>}
                   </td>
                   <td className="py-4 text-right font-medium text-slate-800 whitespace-nowrap">{format(r.result.payoffDate, 'MMM yyyy')}</td>
                   <td className="py-4 text-right text-slate-600 whitespace-nowrap">
                     {isBaseline ? '-' : (timeSaved > 0 ? `${Math.floor(timeSaved/12)}y ${timeSaved%12}m` : 'None')}
                   </td>
                   <td className="py-4 text-right font-bold text-teal-700 whitespace-nowrap">
                     {isBaseline ? '-' : formatCurrency(Math.max(0, interestSaved))}
                   </td>
                 </tr>
               );
             })}
           </tbody>
         </table>
      </div>

      <div className="mt-16 text-center text-xs text-slate-400 border-t border-slate-100 pt-6">
        This report was generated by Bond Hacker and is for informational purposes only. It does not constitute financial advice.
      </div>
    </div>,
    document.body
  );
};

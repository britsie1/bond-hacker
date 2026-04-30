import React, { useMemo } from 'react';
import { FileText, Percent, Calendar, Lightbulb, Wallet, Briefcase } from 'lucide-react';
import { Card } from '../ui/Card';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { NumericInput } from './NumericInput';
import { cn } from '../../lib/utils';
import type { LoanInputs } from '../../utils/loanMath';
import { formatCurrency } from '../../utils/formatters';

interface LoanDetailsCardProps {
  isNewLoan: boolean;
  setIsNewLoan: (val: boolean) => void;
  inputs: LoanInputs;
  setInputs: (val: LoanInputs) => void;
}

export const LoanDetailsCard: React.FC<LoanDetailsCardProps> = ({ isNewLoan, setIsNewLoan, inputs, setInputs }) => {
  const handleBalanceChange = (val: number) => {
    setInputs({
      ...inputs,
      currentOutstanding: val,
    });
  };

  const installment = useMemo(() => {
    const totalRemainingMonths = (inputs.remainingTermYears * 12) + inputs.remainingTermMonths;
    if (totalRemainingMonths <= 0) return 0;
    const monthlyRate = inputs.interestRate / 100 / 12;
    const pmt = monthlyRate === 0 
      ? inputs.currentOutstanding / totalRemainingMonths 
      : (inputs.currentOutstanding * monthlyRate * Math.pow(1 + monthlyRate, totalRemainingMonths)) / 
        (Math.pow(1 + monthlyRate, totalRemainingMonths) - 1);

    return pmt + (inputs.monthlyServiceFee || 0) + (inputs.monthlyAssurance || 0) + (inputs.monthlyInsurance || 0);
  }, [inputs]);

  return (
    <Card>
      <div className="flex items-center gap-2.5 mb-2 font-bold text-lg text-[var(--text)]">
        <FileText className="text-primary w-5 h-5" />
        Your Loan Details
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-6">We'll use this to calculate your savings</p>

      <div className="space-y-6">
        {/* Fancy Toggle */}
        <div className="p-1 bg-[var(--bg)] rounded-2xl border-2 border-[var(--border)] flex">
          <button 
            type="button"
            onClick={() => setIsNewLoan(false)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all",
              !isNewLoan ? "bg-[var(--surface)] text-primary shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            <Briefcase size={14} />
            EXISTING LOAN
          </button>
          <button 
            type="button"
            onClick={() => {
              setIsNewLoan(true);
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all",
              isNewLoan ? "bg-[var(--surface)] text-primary shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            <Wallet size={14} />
            NEW PURCHASE
          </button>
        </div>

        {isNewLoan && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <Label>Property Purchase Price</Label>
            <NumericInput
              prefix="R"
              value={inputs.loanAmount}
              onChange={(val) => setInputs({...inputs, loanAmount: val})}
            />
          </div>
        )}
        <div>
          <Label>{isNewLoan ? 'Required Bond Amount' : 'Outstanding Balance'}</Label>
          <NumericInput 
            prefix="R" 
            value={inputs.currentOutstanding} 
            onChange={handleBalanceChange} 
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {[500000, 1000000, 1500000, 2000000].map(val => (
              <button 
                key={val} 
                type="button"
                onClick={() => handleBalanceChange(val)}
                className={cn(
                  "px-3 py-1.5 border-2 rounded-full text-xs font-medium transition-all",
                  inputs.currentOutstanding === val 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-[var(--border)] hover:border-primary hover:bg-primary/5 text-[var(--text)]"
                )}
              >
                R{val >= 1000000 ? `${val / 1000000}m` : `${val / 1000}k`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Interest Rate (Nominal)</Label>
          <NumericInput 
            icon={<Percent size={16} />} 
            suffix="%" 
            value={inputs.interestRate}
            onChange={(val) => setInputs({...inputs, interestRate: val})}
            decimals={2}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {[9.75, 10.75, 11.75, 12.75].map(val => (
              <button 
                key={val} 
                type="button"
                onClick={() => setInputs({...inputs, interestRate: val})}
                className={cn(
                  "px-3 py-1.5 border-2 rounded-full text-xs font-medium transition-all",
                  inputs.interestRate === val 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-[var(--border)] hover:border-primary hover:bg-primary/5 text-[var(--text)]"
                )}
              >
                {val.toFixed(2)}%
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>{isNewLoan ? 'Loan Term' : 'Remaining Term'}</Label>
          <div className={cn("grid gap-4", !isNewLoan ? "grid-cols-2" : "grid-cols-1")}>
            <Input icon={<Calendar size={16} />} isSelect value={inputs.remainingTermYears} onChange={(e) => setInputs({...inputs, remainingTermYears: Number(e.target.value)})}>
              {Array.from({ length: 31 }, (_, i) => i).map(yr => (
                <option key={yr} value={yr}>{yr} {yr === 1 ? 'year' : 'years'}</option>
              ))}
            </Input>
            {!isNewLoan && (
              <Input isSelect value={inputs.remainingTermMonths} onChange={(e) => setInputs({...inputs, remainingTermMonths: Number(e.target.value)})}>
                {Array.from({ length: 12 }, (_, i) => i).map(mo => (
                  <option key={mo} value={mo}>{mo} {mo === 1 ? 'month' : 'months'}</option>
                ))}
              </Input>
            )}
          </div>
        </div>

        <div>
          <Label>Monthly Service Fee</Label>
          <NumericInput 
            prefix="R" 
            value={inputs.monthlyServiceFee || 0}
            onChange={(val) => setInputs({...inputs, monthlyServiceFee: val})}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Life Assurance *</Label>
            <NumericInput prefix="R" value={inputs.monthlyAssurance || 0} onChange={(val) => setInputs({...inputs, monthlyAssurance: val})} />
          </div>
          <div>
            <Label>Building Insurance *</Label>
            <NumericInput prefix="R" value={inputs.monthlyInsurance || 0} onChange={(val) => setInputs({...inputs, monthlyInsurance: val})} />
          </div>
        </div>

        <p className="text-[9px] text-[var(--text-muted)] leading-relaxed italic px-1">
          * Only include these if your bank collects them as part of your monthly bond installment.
        </p>

        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-1.5 bg-primary/10 rounded-lg text-primary">
              <Lightbulb size={14} />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-primary uppercase tracking-tight">Insurance Hack</p>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                You don't <i>have</i> to use the bank's insurance. Ceding your own life policy or finding an independent building insurer can often save you <b>R200–R500 per month</b>.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-5 mt-2 border-t border-[var(--border)] flex justify-between items-end">
          <div className="space-y-1">
             <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest">Est. Monthly Installment</div>
             <div className="text-3xl font-black text-primary leading-none text-teal-700 dark:text-teal-500">{formatCurrency(installment)}</div>
          </div>
          <div className="text-[10px] text-[var(--text-muted)] italic text-right max-w-[140px] leading-tight">
            * Incl. fees & insurance
          </div>
        </div>
      </div>
    </Card>
  );
};

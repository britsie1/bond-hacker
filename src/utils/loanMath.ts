import { addMonths, differenceInDays, differenceInMonths, endOfMonth, startOfMonth } from 'date-fns';

export interface Scenario {
  id: string;
  name: string;
  lumpSums: LumpSum[];
  extraMonthlyPayment: number;
  fixedMonthlyPayment?: number;
  targetPayoffDate?: Date;
  annualExtraIncrement?: number; // Annual % increase for extra payment
  isAccessBond?: boolean;
  salaryAmount?: number;
  salarySpent?: number;
  savings?: number;
  payDay?: number;
  currentDebitDay?: number;
  debitOrderDay?: number;
  interestRate?: number; // Override interest rate for this scenario
  initialBalanceReduction?: number; // Reduction in initial balance (e.g. paying costs in cash)
}

export interface LumpSum {
  monthIndex: number; // Months from start
  amount: number;
  frequency?: 'once' | 'annual';
}

export interface LoanInputs {
  loanAmount: number;
  currentOutstanding: number;
  interestRate: number; // Annual percentage (e.g., 11.75)
  interestRateHike: number; // Potential hike for stress testing
  remainingTermYears: number;
  remainingTermMonths: number;
  startDate: Date;
  isAccessBond?: boolean;
  monthlyServiceFee?: number;
  monthlyAssurance?: number; // Life cover
  monthlyInsurance?: number; // Building cover (HOC)
  debitOrderDay?: number;
}

export interface ScheduleEntry {
  month: number;
  date: Date;
  openingBalance: number;
  payment: number;
  interest: number;
  principal: number;
  extraPayment: number;
  closingBalance: number;
  interestSavedByOffset: number;
  assurance: number;
  insurance: number;
}

export interface LoanResult {
  schedule: ScheduleEntry[];
  totalInterest: number;
  totalServiceFees: number;
  totalAssurance: number;
  totalInsurance: number;
  payoffDate: Date;
  totalMonths: number;
  tippingPointMonth: number | null;
  interestSavedByOffset: number;
}

export function calculateMonthlyPayment(principal: number, annualRate: number, totalMonths: number): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / totalMonths;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
}

export function calculateLoanSchedule(inputs: LoanInputs, scenario: Scenario): LoanResult {
  const { currentOutstanding, interestRate, interestRateHike, startDate, remainingTermYears, remainingTermMonths } = inputs;
  
  const baselineDebitDay = scenario.currentDebitDay !== undefined ? scenario.currentDebitDay : (inputs.debitOrderDay || 1);
  const targetDebitDay = scenario.debitOrderDay || baselineDebitDay;
  
  const baseRate = scenario.interestRate !== undefined ? scenario.interestRate : interestRate;
  const effectiveRate = baseRate + (interestRateHike || 0);
  const annualRateDecimal = effectiveRate / 100;
  
  let currentBalance = currentOutstanding - (scenario.initialBalanceReduction || 0);
  
  const totalRemainingMonths = (remainingTermYears * 12) + remainingTermMonths;
  const baseMonthlyPayment = calculateMonthlyPayment(currentBalance, effectiveRate, totalRemainingMonths);

  const schedule: ScheduleEntry[] = [];
  let totalInterest = 0;
  let totalServiceFees = 0;
  let totalAssurance = 0;
  let totalInsurance = 0;
  let interestSavedByOffset = 0;
  let virtualSavingsTrack = scenario.savings || 0;
  let month = 0;

  const maxMonths = 12 * 50;

  while (currentBalance > 0.01 && month < maxMonths) {
    const currentDate = addMonths(startDate, month);
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const daysInMonth = differenceInDays(end, start) + 1;
    const openingBalance = currentBalance;

    // Calculate the "Time Hack" gap for THIS specific month.
    // E.g. moving from 1st to 27th:
    // In a 31-day month: (31 - 27 + 1) + (1 - 1) = 5 days.
    // In a 30-day month: (30 - 27 + 1) + (1 - 1) = 4 days.
    let currentDaysAdvanced = 0;
    if (targetDebitDay !== baselineDebitDay) {
      if (targetDebitDay < baselineDebitDay) {
        currentDaysAdvanced = baselineDebitDay - targetDebitDay;
      } else {
        currentDaysAdvanced = (daysInMonth - targetDebitDay + 1) + (baselineDebitDay - 1);
      }
    }
    
    const assuranceRate = (inputs.monthlyAssurance || 0) / (inputs.currentOutstanding || 1);
    const currentAssurance = Math.max(0, openingBalance * assuranceRate);
    const monthlyCosts = (inputs.monthlyServiceFee || 0) + currentAssurance + (inputs.monthlyInsurance || 0);

    let scheduledPayment = baseMonthlyPayment;
    if (scenario.fixedMonthlyPayment !== undefined && scenario.fixedMonthlyPayment > 0) {
      scheduledPayment = Math.max(0, scenario.fixedMonthlyPayment - monthlyCosts);
    }

    let extraPayment = scenario.extraMonthlyPayment;
    if (scenario.annualExtraIncrement && scenario.annualExtraIncrement > 0) {
      const yearsElapsed = Math.floor(month / 12);
      extraPayment = scenario.extraMonthlyPayment * Math.pow(1 + (scenario.annualExtraIncrement / 100), yearsElapsed);
    }

    const isAccessBond = !!(inputs.isAccessBond || scenario.isAccessBond);
    let interestOffset = 0;
    let monthlyInterestSavedByOffset = 0;

    if (isAccessBond) {
      const salary = scenario.salaryAmount || 0;
      const spent = scenario.salarySpent || 0;
      const unspent = Math.max(0, salary - spent);
      
      if (month === 0 && scenario.savings && scenario.savings > 0) {
        extraPayment += scenario.savings;
      }
      
      extraPayment += unspent;
      interestOffset = (scenario.savings || 0) + salary - (spent / 2);

      const avgVirtualBalance = virtualSavingsTrack + salary - (spent / 2);
      monthlyInterestSavedByOffset = (avgVirtualBalance * annualRateDecimal * daysInMonth) / 365;

      virtualSavingsTrack += monthlyInterestSavedByOffset + unspent;
      interestSavedByOffset += monthlyInterestSavedByOffset;
    }

    const lumpSum = scenario.lumpSums.find(ls => {
      if (ls.frequency === 'annual') {
        return month >= ls.monthIndex && (month - ls.monthIndex) % 12 === 0;
      }
      return ls.monthIndex === month;
    });
    if (lumpSum) {
      extraPayment += lumpSum.amount;
    }

    const balanceForInterest = Math.max(0, currentBalance - interestOffset);
    
    // 1. Calculate Baseline Interest (Daily accrual based on the CURRENT baseline day)
    // This ensures compatibility with standard bond rules and leap year tests.
    const baselineIntBefore = (balanceForInterest * annualRateDecimal * (baselineDebitDay - 1)) / 365;
    const baselineIntAfter = (Math.max(0, balanceForInterest - scheduledPayment) * annualRateDecimal * (daysInMonth - (baselineDebitDay - 1))) / 365;
    const totalBaselineInt = baselineIntBefore + baselineIntAfter;

    // 2. Calculate the "Timing Hack" bonus:
    // Bonus = (Installment Amount) * (Annual Rate / 365) * (Days Advanced)
    const timingBonus = ((scheduledPayment + extraPayment) * annualRateDecimal * currentDaysAdvanced) / 365;
    
    // 3. Final interest for this scenario is the baseline minus the early-payment bonus.
    const interest = Math.max(0, totalBaselineInt - timingBonus);
    let totalPayment = scheduledPayment + extraPayment;

    if (totalPayment > (currentBalance + interest)) {
      totalPayment = currentBalance + interest;
    }

    const principal = Math.max(0, totalPayment - interest);
    currentBalance = Math.max(0, currentBalance + interest - totalPayment);
    
    totalInterest += interest;
    totalServiceFees += (inputs.monthlyServiceFee || 0);
    totalAssurance += currentAssurance;
    totalInsurance += (inputs.monthlyInsurance || 0);

    schedule.push({
      month,
      date: currentDate,
      openingBalance,
      payment: totalPayment - extraPayment,
      interest,
      principal,
      extraPayment,
      closingBalance: currentBalance,
      interestSavedByOffset: monthlyInterestSavedByOffset,
      assurance: currentAssurance,
      insurance: (inputs.monthlyInsurance || 0)
    });

    month++;
  }

  const tippingPointMonth = schedule.findIndex(entry => entry.principal > entry.interest);

  return {
    schedule,
    totalInterest,
    totalServiceFees,
    totalAssurance,
    totalInsurance,
    payoffDate: schedule.length > 0 ? schedule[schedule.length - 1].date : startDate,
    totalMonths: schedule.length,
    tippingPointMonth: tippingPointMonth !== -1 ? tippingPointMonth : null,
    interestSavedByOffset
  };
}

export type SolveTarget = 'extraMonthlyPayment' | 'fixedMonthlyPayment' | 'annualExtraIncrement';

export function calculateTargetExtraPayment(
  inputs: LoanInputs, 
  targetDate: Date, 
  scenario: Scenario,
  solveFor: SolveTarget = 'extraMonthlyPayment'
): number {
  const targetMonths = differenceInMonths(targetDate, inputs.startDate);
  if (targetMonths <= 0) return 0;
  
  let low = 0;
  let high = solveFor === 'annualExtraIncrement' ? 500 : inputs.currentOutstanding; 
  
  let baseExtraForIncr = scenario.extraMonthlyPayment;
  if (solveFor === 'annualExtraIncrement' && baseExtraForIncr <= 0) {
    baseExtraForIncr = 500; 
  }

  if (solveFor === 'fixedMonthlyPayment') {
    const totalRemMonths = (inputs.remainingTermYears * 12) + inputs.remainingTermMonths;
    const basePMT = calculateMonthlyPayment(inputs.currentOutstanding, inputs.interestRate + inputs.interestRateHike, totalRemMonths);
    low = basePMT;
    high = Math.max(high, basePMT * 10); 
  }

  let val = 0;
  for (let i = 0; i < 30; i++) {
    val = (low + high) / 2;
    const testScenario: Scenario = { 
      ...scenario, 
      extraMonthlyPayment: solveFor === 'annualExtraIncrement' ? baseExtraForIncr : scenario.extraMonthlyPayment,
      [solveFor]: val, 
      targetPayoffDate: undefined 
    };
    
    const res = calculateLoanSchedule(inputs, testScenario);
    
    if (res.totalMonths > targetMonths) {
      low = val;
    } else {
      high = val;
    }
  }
  
  return solveFor === 'annualExtraIncrement' ? Number(high.toFixed(2)) : Math.ceil(high);
}

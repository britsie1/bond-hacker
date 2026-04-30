import { parseISO, isValid } from 'date-fns';
import { calculateLoanSchedule, calculateTargetExtraPayment } from './loanMath';
import type { LoanInputs, Scenario, LoanResult } from './loanMath';
import { calculatePropertyCosts } from './costCalculators';
import type { Strategy } from '../store/loanStore';

export interface StrategyResult {
  strategy: Strategy;
  result: LoanResult;
  solvedValue?: number;
  appliedScenario: Scenario;
}

export function calculateResults(inputs: LoanInputs, strategies: Strategy[]): StrategyResult[] {
  // Only calculate for enabled strategies or baseline
  const individualResults = strategies.map(s => {
    // If it's not enabled and not baseline, skip calculation to save tokens/performance
    // but we need to return something for the map
    if (!s.enabled && s.id !== 'baseline') return null;

    const finalScenario: Scenario = { 
      ...s, 
      targetPayoffDate: s.targetPayoffDate ? parseISO(s.targetPayoffDate) : undefined,
      debitOrderDay: s.id === 'debit' ? (s.debitOrderDay ?? (s.currentDebitDay || inputs.debitOrderDay)) : inputs.debitOrderDay,
      currentDebitDay: s.id === 'debit' ? (s.currentDebitDay ?? inputs.debitOrderDay) : inputs.debitOrderDay,
      isAccessBond: s.id === 'access' || s.isAccessBond
    };

    if (s.id === 'upfront') {
      const costs = calculatePropertyCosts(inputs.loanAmount, inputs.currentOutstanding);
      let reduction = 0;
      if (s.payInitiationFee) reduction += costs.bankInitiationFee;
      if (s.payTransferCosts) reduction += costs.transferDuty;
      if (s.payAttorneyFees) reduction += (costs.conveyancingFees + costs.bondRegistrationFees + costs.vatOnFees);
      finalScenario.initialBalanceReduction = reduction;
    }
    
    let solvedValue: number | undefined;

    if (finalScenario.targetPayoffDate && isValid(finalScenario.targetPayoffDate)) {
      const target = s.solveTarget || 'extraMonthlyPayment';
      solvedValue = calculateTargetExtraPayment(inputs, finalScenario.targetPayoffDate, finalScenario, target);
      
      // Apply the solved value to the final scenario for calculation
      finalScenario[target] = solvedValue;

      if (target === 'annualExtraIncrement' && (finalScenario.extraMonthlyPayment || 0) <= 0) {
        finalScenario.extraMonthlyPayment = 500;
      }
    }

    // Fix for escalation strategy: if no extra payment set, use a small base
    if (s.id === 'escalate' && !finalScenario.targetPayoffDate && (finalScenario.annualExtraIncrement || 0) > 0 && (finalScenario.extraMonthlyPayment || 0) <= 0) {
       finalScenario.extraMonthlyPayment = 500;
    }

    return {
      strategy: s,
      result: calculateLoanSchedule(inputs, finalScenario),
      solvedValue,
      appliedScenario: finalScenario // Store the scenario with solved values
    };
  }).filter(Boolean) as StrategyResult[];

  // Calculate combined strategy
  const activeStrategies = individualResults.filter(r => r.strategy.id !== 'baseline' && r.strategy.enabled);
  if (activeStrategies.length === 0) return individualResults;

  const combinedStrategy: Scenario = {
    id: 'combined',
    name: 'Combined Strategy',
    lumpSums: [],
    extraMonthlyPayment: 0,
    debitOrderDay: inputs.debitOrderDay
  };

  activeStrategies.forEach(({ strategy, appliedScenario }) => {
    if (strategy.id === 'debit') {
      combinedStrategy.debitOrderDay = appliedScenario.debitOrderDay;
      combinedStrategy.currentDebitDay = appliedScenario.currentDebitDay;
    }
    if (strategy.id === 'boost') combinedStrategy.extraMonthlyPayment = (combinedStrategy.extraMonthlyPayment || 0) + (appliedScenario.extraMonthlyPayment || 0);
    if (strategy.id === 'escalate') {
        combinedStrategy.annualExtraIncrement = appliedScenario.annualExtraIncrement;
        if ((combinedStrategy.extraMonthlyPayment || 0) === 0) combinedStrategy.extraMonthlyPayment = (appliedScenario.extraMonthlyPayment || 500);
    }
    if (strategy.id === 'lump') combinedStrategy.lumpSums = [...(combinedStrategy.lumpSums || []), ...(appliedScenario.lumpSums || [])];
    if (strategy.id === 'fixed') combinedStrategy.fixedMonthlyPayment = appliedScenario.fixedMonthlyPayment;
    if (strategy.id === 'access') {
        combinedStrategy.isAccessBond = true;
        combinedStrategy.savings = appliedScenario.savings;
        combinedStrategy.salaryAmount = appliedScenario.salaryAmount;
        combinedStrategy.salarySpent = appliedScenario.salarySpent;
    }
    if (strategy.id === 'negotiate') combinedStrategy.interestRate = appliedScenario.interestRate;
    if (strategy.id === 'upfront') combinedStrategy.initialBalanceReduction = appliedScenario.initialBalanceReduction;
  });

  const combinedResult: StrategyResult = {
    strategy: { ...combinedStrategy, color: '#000000', enabled: true } as Strategy,
    result: calculateLoanSchedule(inputs, combinedStrategy),
    appliedScenario: combinedStrategy
  };

  return [...individualResults, combinedResult];
}
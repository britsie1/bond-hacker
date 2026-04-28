import { useState, useMemo, useEffect } from 'react';
import { parseISO, isValid } from 'date-fns';
import { calculateLoanSchedule, calculateTargetExtraPayment } from '../utils/loanMath';
import type { LoanInputs, Scenario, LoanResult } from '../utils/loanMath';
import { decodeState, type Strategy as UrlStrategy } from '../utils/urlState';
import { calculatePropertyCosts } from '../utils/costCalculators';

export type { LoanInputs };

export interface StrategyResult {
  strategy: Strategy;
  result: LoanResult;
  solvedValue?: number;
  appliedScenario: Scenario;
}

export const DEFAULT_INPUTS: LoanInputs = {
  loanAmount: 1000000,
  currentOutstanding: 1000000,
  interestRate: 11.75,
  interestRateHike: 0,
  remainingTermYears: 20,
  remainingTermMonths: 0,
  startDate: new Date(),
  isAccessBond: false,
  monthlyServiceFee: 69,
  monthlyAssurance: 0,
  monthlyInsurance: 0,
  debitOrderDay: 1
};

export const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export interface Strategy extends UrlStrategy {
  color: string;
  enabled?: boolean;
}

export function useBondState() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [inputs, setInputs] = useState<LoanInputs>(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedState = params.get('s') ? decodeState(params.get('s')!) : null;
    if (sharedState) return sharedState.inputs;

    const saved = localStorage.getItem('loan_inputs');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...DEFAULT_INPUTS, 
        ...parsed, 
        startDate: parsed.startDate ? new Date(parsed.startDate) : DEFAULT_INPUTS.startDate 
      };
    }
    return DEFAULT_INPUTS;
  });

  const [strategies, setStrategies] = useState<Strategy[]>(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedState = params.get('s') ? decodeState(params.get('s')!) : null;
    if (sharedState) return sharedState.strategies;

    const saved = localStorage.getItem('loan_strategies');
    const parsed: Strategy[] = saved ? JSON.parse(saved) : [
      { 
        id: 'baseline', 
        name: 'Baseline', 
        lumpSums: [], 
        extraMonthlyPayment: 0, 
        color: COLORS[0],
        enabled: true
      }
    ];
    return parsed;
  });

  useEffect(() => {
    localStorage.setItem('loan_inputs', JSON.stringify(inputs));
  }, [inputs]);

  useEffect(() => {
    localStorage.setItem('loan_strategies', JSON.stringify(strategies));
  }, [strategies]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const results = useMemo(() => {
    // Only calculate for enabled strategies or baseline
    const individualResults = strategies.map(s => {
      // If it's not enabled and not baseline, skip calculation to save tokens/performance
      // but we need to return something for the map
      if (!s.enabled && s.id !== 'baseline') return null;

      let finalScenario: Scenario = { 
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
        // @ts-ignore - Dynamic key assignment
        finalScenario[target] = solvedValue;

        if (target === 'annualExtraIncrement' && finalScenario.extraMonthlyPayment <= 0) {
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
      if (strategy.id === 'boost') combinedStrategy.extraMonthlyPayment += (appliedScenario.extraMonthlyPayment || 0);
      if (strategy.id === 'escalate') {
          combinedStrategy.annualExtraIncrement = appliedScenario.annualExtraIncrement;
          if (combinedStrategy.extraMonthlyPayment === 0) combinedStrategy.extraMonthlyPayment = (appliedScenario.extraMonthlyPayment || 500);
      }
      if (strategy.id === 'lump') combinedStrategy.lumpSums = [...combinedStrategy.lumpSums, ...appliedScenario.lumpSums];
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
  }, [inputs, strategies]);

  const toggleStrategy = (id: string, defaultName: string, iconColor: string) => {
    const exists = strategies.find(s => s.id === id);
    if (exists) {
      if (id === 'baseline') return; // Cannot remove baseline
      setStrategies(strategies.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
    } else {
      const newStrategy: Strategy = {
        id,
        name: defaultName,
        lumpSums: [],
        extraMonthlyPayment: 0,
        color: iconColor,
        enabled: true,
        // Default values for specific strategies
        ...(id === 'debit' ? { payDay: 25, currentDebitDay: inputs.debitOrderDay || 1, debitOrderDay: inputs.debitOrderDay || 1 } : {}),
        ...(id === 'negotiate' ? { interestRate: inputs.interestRate } : {}),
        ...(id === 'upfront' ? { initialBalanceReduction: 0 } : {})
      };
      setStrategies([...strategies, newStrategy]);
    }
  };

  const updateStrategy = (id: string, updates: Partial<Strategy>) => {
    setStrategies(strategies.map(s => s.id === id ? { ...s, ...updates } : s));
    
    // If the user updates their current payment day in the debit strategy,
    // we should update the global debitOrderDay to keep the baseline in sync.
    if (id === 'debit' && updates.currentDebitDay !== undefined) {
      setInputs(prev => ({ ...prev, debitOrderDay: updates.currentDebitDay }));
    }
  };

  return {
    currentStep,
    setCurrentStep,
    isDarkMode,
    setIsDarkMode,
    inputs,
    setInputs,
    strategies,
    results,
    toggleStrategy,
    updateStrategy
  };
}

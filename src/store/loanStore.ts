import { create } from 'zustand';
import { decodeState, type Strategy as UrlStrategy } from '../utils/urlState';
import type { LoanInputs } from '../utils/loanMath';

export type { LoanInputs };

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

interface LoanState {
  inputs: LoanInputs;
  strategies: Strategy[];
  setInputs: (inputs: LoanInputs | ((prev: LoanInputs) => LoanInputs)) => void;
  toggleStrategy: (id: string, defaultName: string, iconColor: string) => void;
  updateStrategy: (id: string, updates: Partial<Strategy>) => void;
}

const getInitialInputs = (): LoanInputs => {
  if (typeof window !== 'undefined') {
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
  }
  return DEFAULT_INPUTS;
};

const getInitialStrategies = (): Strategy[] => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const sharedState = params.get('s') ? decodeState(params.get('s')!) : null;
    if (sharedState) return sharedState.strategies;

    const saved = localStorage.getItem('loan_strategies');
    if (saved) {
      return JSON.parse(saved);
    }
  }
  return [
    { 
      id: 'baseline', 
      name: 'Baseline', 
      lumpSums: [], 
      extraMonthlyPayment: 0, 
      color: COLORS[0],
      enabled: true
    }
  ];
};

export const useLoanStore = create<LoanState>((set) => ({
  inputs: getInitialInputs(),
  strategies: getInitialStrategies(),
  
  setInputs: (newInputs) => set((state) => {
    const resolvedInputs = typeof newInputs === 'function' ? newInputs(state.inputs) : newInputs;
    if (typeof window !== 'undefined') {
      localStorage.setItem('loan_inputs', JSON.stringify(resolvedInputs));
    }
    return { inputs: resolvedInputs };
  }),

  toggleStrategy: (id, defaultName, iconColor) => set((state) => {
    const exists = state.strategies.find(s => s.id === id);
    let newStrategies;
    
    if (exists) {
      if (id === 'baseline') return state; // Cannot remove baseline
      newStrategies = state.strategies.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
    } else {
      const newStrategy: Strategy = {
        id,
        name: defaultName,
        lumpSums: [],
        extraMonthlyPayment: 0,
        color: iconColor,
        enabled: true,
        // Default values for specific strategies
        ...(id === 'debit' ? { payDay: 25, currentDebitDay: state.inputs.debitOrderDay || 1, debitOrderDay: state.inputs.debitOrderDay || 1 } : {}),
        ...(id === 'negotiate' ? { interestRate: state.inputs.interestRate } : {}),
        ...(id === 'upfront' ? { initialBalanceReduction: 0 } : {})
      };
      newStrategies = [...state.strategies, newStrategy];
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('loan_strategies', JSON.stringify(newStrategies));
    }
    return { strategies: newStrategies };
  }),

  updateStrategy: (id, updates) => set((state) => {
    const newStrategies = state.strategies.map(s => s.id === id ? { ...s, ...updates } : s);
    let newInputs = state.inputs;

    // If the user updates their current payment day in the debit strategy,
    // we should update the global debitOrderDay to keep the baseline in sync.
    if (id === 'debit' && updates.currentDebitDay !== undefined) {
      newInputs = { ...newInputs, debitOrderDay: updates.currentDebitDay };
      if (typeof window !== 'undefined') {
        localStorage.setItem('loan_inputs', JSON.stringify(newInputs));
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('loan_strategies', JSON.stringify(newStrategies));
    }
    
    return { strategies: newStrategies, inputs: newInputs };
  })
}));

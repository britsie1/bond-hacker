import { describe, it, expect } from 'vitest';
import { useLoanStore, DEFAULT_INPUTS, COLORS } from './loanStore';

describe('loanStore', () => {
  it('should initialize with default inputs and baseline strategy', () => {
    const state = useLoanStore.getState();
    expect(state.inputs).toEqual(DEFAULT_INPUTS);
    expect(state.strategies).toHaveLength(1);
    expect(state.strategies[0].id).toBe('baseline');
    expect(state.strategies[0].enabled).toBe(true);
  });

  it('should toggle a strategy on and off', () => {
    const { toggleStrategy } = useLoanStore.getState();
    
    // Toggle ON
    toggleStrategy('boost', 'Monthly Boost', COLORS[1]);
    let state = useLoanStore.getState();
    expect(state.strategies.find(s => s.id === 'boost')?.enabled).toBe(true);
    
    // Toggle OFF
    toggleStrategy('boost', 'Monthly Boost', COLORS[1]);
    state = useLoanStore.getState();
    expect(state.strategies.find(s => s.id === 'boost')?.enabled).toBe(false);
  });

  it('should update a strategy property', () => {
    const { toggleStrategy, updateStrategy } = useLoanStore.getState();
    
    // Ensure it exists
    toggleStrategy('boost', 'Monthly Boost', COLORS[1]);
    
    updateStrategy('boost', { extraMonthlyPayment: 1500 });
    const state = useLoanStore.getState();
    expect(state.strategies.find(s => s.id === 'boost')?.extraMonthlyPayment).toBe(1500);
  });

  it('should sync debitOrderDay between store and inputs when updating debit strategy', () => {
    const { toggleStrategy, updateStrategy } = useLoanStore.getState();
    
    toggleStrategy('debit', 'Early Debit Order', COLORS[2]);
    updateStrategy('debit', { currentDebitDay: 15 });
    
    const state = useLoanStore.getState();
    expect(state.inputs.debitOrderDay).toBe(15);
  });
});

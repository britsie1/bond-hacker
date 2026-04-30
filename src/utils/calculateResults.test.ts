import { describe, it, expect } from 'vitest';
import { calculateResults } from './calculateResults';
import { DEFAULT_INPUTS, COLORS } from '../store/loanStore';
import type { Strategy } from '../store/loanStore';

describe('calculateResults', () => {
  const baseStrategy: Strategy = {
    id: 'baseline',
    name: 'Baseline',
    lumpSums: [],
    extraMonthlyPayment: 0,
    color: COLORS[0],
    enabled: true
  };

  it('should return only the baseline result if no other strategies are enabled', () => {
    const results = calculateResults(DEFAULT_INPUTS, [baseStrategy]);
    expect(results).toHaveLength(1);
    expect(results[0].strategy.id).toBe('baseline');
    expect(results[0].result.schedule.length).toBeGreaterThan(0);
  });

  it('should generate individual and combined results for multiple enabled strategies', () => {
    const boostStrategy: Strategy = {
      id: 'boost',
      name: 'Monthly Boost',
      lumpSums: [],
      extraMonthlyPayment: 1000,
      color: COLORS[1],
      enabled: true
    };

    const results = calculateResults(DEFAULT_INPUTS, [baseStrategy, boostStrategy]);
    // Expect: Baseline, Boost, Combined
    expect(results).toHaveLength(3);
    
    const boostResult = results.find(r => r.strategy.id === 'boost');
    const combinedResult = results.find(r => r.strategy.id === 'combined');
    
    expect(boostResult).toBeDefined();
    expect(combinedResult).toBeDefined();
    
    // The boost result should be faster (pay less interest) than the baseline
    const baseResult = results.find(r => r.strategy.id === 'baseline');
    expect(boostResult!.result.totalInterest).toBeLessThan(baseResult!.result.totalInterest);
    
    // In this simple case, combined should match boost exactly since it's the only active non-baseline
    expect(combinedResult!.result.totalInterest).toBe(boostResult!.result.totalInterest);
  });

  it('should correctly ignore disabled strategies', () => {
    const disabledStrategy: Strategy = {
      id: 'fixed',
      name: 'Fixed Payment',
      lumpSums: [],
      extraMonthlyPayment: 0,
      color: COLORS[2],
      enabled: false
    };

    const results = calculateResults(DEFAULT_INPUTS, [baseStrategy, disabledStrategy]);
    expect(results).toHaveLength(1);
    expect(results[0].strategy.id).toBe('baseline');
  });
});

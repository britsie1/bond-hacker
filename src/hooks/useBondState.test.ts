import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBondState } from './useBondState';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('useBondState', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useBondState());
    expect(result.current.currentStep).toBe(1);
    expect(result.current.inputs.loanAmount).toBe(1000000);
    expect(result.current.strategies).toHaveLength(1);
    expect(result.current.strategies[0].id).toBe('baseline');
  });

  it('should toggle strategies correctly', () => {
    const { result } = renderHook(() => useBondState());
    
    act(() => {
      result.current.toggleStrategy('boost', 'Monthly Boost', '#10b981');
    });
    
    expect(result.current.strategies).toHaveLength(2);
    expect(result.current.strategies.find(s => s.id === 'boost')?.enabled).toBe(true);

    act(() => {
      result.current.toggleStrategy('boost', 'Monthly Boost', '#10b981');
    });

    // Strategy remains in the list but is disabled
    expect(result.current.strategies).toHaveLength(2);
    expect(result.current.strategies.find(s => s.id === 'boost')?.enabled).toBe(false);
  });

  it('should update inputs and recalculate results', () => {
    const { result } = renderHook(() => useBondState());
    
    const initialTotalInterest = result.current.results[0].result.totalInterest;

    act(() => {
      result.current.setInputs({
        ...result.current.inputs,
        interestRate: 15 // Increase rate
      });
    });

    const newTotalInterest = result.current.results[0].result.totalInterest;
    expect(newTotalInterest).toBeGreaterThan(initialTotalInterest);
  });

  it('should update scenario and recalculate results', () => {
    const { result } = renderHook(() => useBondState());
    
    act(() => {
      result.current.toggleStrategy('boost', 'Monthly Boost', '#10b981');
    });

    const boostIndex = result.current.results.findIndex(r => r.strategy.id === 'boost');
    const initialInterest = result.current.results[boostIndex].result.totalInterest;

    act(() => {
      result.current.updateStrategy('boost', { extraMonthlyPayment: 1000 });
    });

    const updatedInterest = result.current.results[boostIndex].result.totalInterest;
    expect(updatedInterest).toBeLessThan(initialInterest);
  });
});

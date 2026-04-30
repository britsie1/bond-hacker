import { useMemo } from 'react';
import { useLoanStore } from '../store/loanStore';
import { calculateResults } from '../utils/calculateResults';

export function useCalculatedResults() {
  const inputs = useLoanStore((state) => state.inputs);
  const strategies = useLoanStore((state) => state.strategies);

  return useMemo(() => calculateResults(inputs, strategies), [inputs, strategies]);
}
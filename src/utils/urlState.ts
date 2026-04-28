import LZString from 'lz-string';
import type { LoanInputs, Scenario } from './loanMath';

// Define Strategy here as well to avoid circular dependencies if needed, 
// or just import from where it makes most sense. 
// For now let's define the interface for State.

export interface Strategy extends Omit<Scenario, 'targetPayoffDate'> {
  color: string;
  targetPayoffDate?: string;
  solveTarget?: 'extraMonthlyPayment' | 'fixedMonthlyPayment' | 'annualExtraIncrement';
  isAccessBond?: boolean;
  salaryAmount?: number;
  salarySpent?: number;
  savings?: number;
  payDay?: number;
  currentDebitDay?: number;
  debitOrderDay?: number;
  interestRate?: number;
  initialBalanceReduction?: number;
  payInitiationFee?: boolean;
  payTransferCosts?: boolean;
  payAttorneyFees?: boolean;
}

export interface AppState {
  inputs: LoanInputs;
  strategies: Strategy[];
}

export function encodeState(state: AppState): string {
  const json = JSON.stringify(state);
  return LZString.compressToEncodedURIComponent(json);
}

export function decodeState(hash: string): AppState | null {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(hash);
    if (!decompressed) return null;
    const parsed = JSON.parse(decompressed);
    
    // Revive Dates
    if (parsed.inputs && parsed.inputs.startDate) {
      parsed.inputs.startDate = new Date(parsed.inputs.startDate);
    }
    
    return parsed as AppState;
  } catch (e) {
    console.error('Failed to decode state from URL', e);
    return null;
  }
}

export function generateShareUrl(state: AppState): string {
  const hash = encodeState(state);
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('s', hash);
  return url.toString();
}

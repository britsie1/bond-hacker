import { describe, it, expect } from 'vitest';
import { formatCurrency, formatTimeSaved } from './formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formats R1000 correctly', () => {
      const formatted = formatCurrency(1000);
      // Remove non-breaking spaces for easier assertion if needed, but simple contain is fine
      expect(formatted).toContain('R');
      expect(formatted).toContain('1');
      expect(formatted).toContain('000');
    });

    it('rounds decimal amounts to zero digits', () => {
      const formatted = formatCurrency(1234.56);
      // 1234.56 rounds to 1235
      expect(formatted).toContain('1');
      expect(formatted).toContain('235');
    });
  });

  describe('formatTimeSaved', () => {
    it('formats 1 month saved correctly', () => {
      expect(formatTimeSaved(1)).toBe('1 mth');
    });

    it('formats 12 months as 1 yr', () => {
      expect(formatTimeSaved(12)).toBe('1 yr');
    });

    it('formats 18 months correctly as 1 yr, 6 mths', () => {
      expect(formatTimeSaved(18)).toBe('1 yr, 6 mths');
    });

    it('returns null for zero or negative months', () => {
      expect(formatTimeSaved(0)).toBeNull();
      expect(formatTimeSaved(-5)).toBeNull();
    });
  });
});

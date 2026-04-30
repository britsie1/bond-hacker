export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(val);
};

export const formatTimeSaved = (months: number) => {
  if (months <= 0) return null;
  const yrs = Math.floor(months / 12);
  const mths = months % 12;
  const parts = [];
  if (yrs > 0) parts.push(`${yrs} yr${yrs > 1 ? 's' : ''}`);
  if (mths > 0) parts.push(`${mths} mth${mths > 1 ? 's' : ''}`);
  return parts.join(', ');
};

/**
 * Safely parses a string input into a number, removing currency symbols, spaces, and handling NaN.
 */
export const parseSafeNumber = (val: string | number, defaultValue: number = 0): number => {
  if (typeof val === 'number') return isNaN(val) ? defaultValue : val;
  
  // Replace comma with dot for European/SA formats
  const normalized = val.replace(/,/g, '.');
  
  // Remove non-numeric characters (except for the decimal point)
  const cleaned = normalized.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? defaultValue : parsed;
};

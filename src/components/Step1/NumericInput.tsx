import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { parseSafeNumber } from '../../utils/formatters';

interface NumericInputProps {
  value: number;
  onChange: (val: number) => void;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  placeholder?: string;
  decimals?: number;
}

export const NumericInput: React.FC<NumericInputProps> = ({ 
  value, 
  onChange, 
  decimals,
  ...props 
}) => {
  const [displayValue, setDisplayValue] = useState<string>(
    decimals !== undefined ? value.toFixed(decimals) : value.toString()
  );
  const [prevValue, setPrevValue] = useState<number>(value);

  // Sync internal string state when external numeric value changes (but only if it's a real change)
  if (value !== prevValue) {
    setPrevValue(value);
    const numericDisplay = parseSafeNumber(displayValue);
    if (numericDisplay !== value) {
      setDisplayValue(decimals !== undefined ? value.toFixed(decimals) : value.toString());
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const raw = e.target.value;
    
    // Allow the user to type dots and commas by keeping the raw string in state
    setDisplayValue(raw);
    
    // Parse it for the actual functional logic
    const numeric = parseSafeNumber(raw);
    onChange(numeric);
  };

  const handleBlur = () => {
    if (decimals !== undefined) {
      setDisplayValue(value.toFixed(decimals));
    }
  };

  return (
    <Input 
      {...props} 
      type="text" 
      inputMode="decimal" 
      value={displayValue} 
      onChange={handleChange} 
      onBlur={handleBlur}
    />
  );
};

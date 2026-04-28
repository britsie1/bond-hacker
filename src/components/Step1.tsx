import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Hero } from './Step1/Hero';
import { LoanDetailsCard } from './Step1/LoanDetailsCard';

import type { LoanInputs } from '../utils/loanMath';

interface Step1Props {
  onNext: () => void;
  isNewLoan: boolean;
  setIsNewLoan: (val: boolean) => void;
  inputs: LoanInputs;
  setInputs: (val: LoanInputs) => void;
}

export const Step1: React.FC<Step1Props> = ({ onNext, isNewLoan, setIsNewLoan, inputs, setInputs }) => {
  return (
    <div>
      <Hero />
      <LoanDetailsCard 
        isNewLoan={isNewLoan} 
        setIsNewLoan={setIsNewLoan} 
        inputs={inputs}
        setInputs={setInputs}
      />

      <button onClick={onNext} className="btn-primary w-full mt-6">
        Calculate My Scenarios
        <ArrowRight size={20} />
      </button>
    </div>
  );
};

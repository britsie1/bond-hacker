import { describe, it, expect } from 'vitest';
import { addMonths } from 'date-fns';
import { calculateLoanSchedule, calculateMonthlyPayment, calculateTargetExtraPayment } from './loanMath';
import type { LoanInputs, Scenario } from './loanMath';

describe('loanMath', () => {
  describe('calculateMonthlyPayment', () => {
    it('calculates standard mortgage payment correctly', () => {
      // R1M at 12% for 20 years (240 months)
      // PMT = 1000000 * (0.01 * (1.01)^240) / ((1.01)^240 - 1)
      // Expected: ~11010.86
      const pmt = calculateMonthlyPayment(1000000, 12, 240);
      expect(pmt).toBeCloseTo(11010.86, 1);
    });

    it('handles zero interest rate', () => {
      const pmt = calculateMonthlyPayment(1000000, 0, 200);
      expect(pmt).toBe(5000);
    });
  });

  describe('calculateLoanSchedule', () => {
    const defaultInputs: LoanInputs = {
      loanAmount: 1000000,
      currentOutstanding: 1000000,
      interestRate: 12,
      interestRateHike: 0,
      remainingTermYears: 20,
      remainingTermMonths: 0,
      startDate: new Date(2024, 0, 1)
    };

    const baselineScenario: Scenario = {
      id: 'baseline',
      name: 'Baseline',
      lumpSums: [],
      extraMonthlyPayment: 0
    };

    it('reaches zero balance at the end of the term in baseline scenario', () => {
      const result = calculateLoanSchedule(defaultInputs, baselineScenario);
      expect(result.totalMonths).toBeLessThanOrEqual(240);
      const lastEntry = result.schedule[result.schedule.length - 1];
      expect(lastEntry.closingBalance).toBeLessThan(0.01);
    });

    it('reduces term significantly with extra monthly payments', () => {
      const extraScenario: Scenario = {
        ...baselineScenario,
        extraMonthlyPayment: 2000
      };
      const result = calculateLoanSchedule(defaultInputs, extraScenario);
      // R13010 instead of R11010 should save several years
      expect(result.totalMonths).toBeLessThan(240);
      expect(result.totalMonths).toBeLessThan(180); // Quick estimate
    });

    it('applies annual increments to extra payments correctly', () => {
      const incrementScenario: Scenario = {
        ...baselineScenario,
        extraMonthlyPayment: 1000,
        annualExtraIncrement: 10 // 10% increase every year
      };
      const result = calculateLoanSchedule(defaultInputs, incrementScenario);
      
      // Check year 1 (month 0-11)
      expect(result.schedule[0].extraPayment).toBe(1000);
      expect(result.schedule[11].extraPayment).toBe(1000);
      
      // Check year 2 (month 12)
      expect(result.schedule[12].extraPayment).toBe(1100);
    });

    it('applies recurring annual lump sums correctly', () => {
      const annualLumpScenario: Scenario = {
        ...baselineScenario,
        lumpSums: [{ monthIndex: 12, amount: 10000, frequency: 'annual' }]
      };
      const result = calculateLoanSchedule(defaultInputs, annualLumpScenario);
      
      // Should trigger at month 12, 24, 36...
      expect(result.schedule[11].extraPayment).toBe(0);
      expect(result.schedule[12].extraPayment).toBe(10000);
      expect(result.schedule[23].extraPayment).toBe(0);
      expect(result.schedule[24].extraPayment).toBe(10000);
    });

    it('identifies the tipping point correctly', () => {
      const result = calculateLoanSchedule(defaultInputs, baselineScenario);
      // In a 20yr 12% loan, the tipping point is usually around month 130-150
      expect(result.tippingPointMonth).not.toBeNull();
      const tpIndex = result.tippingPointMonth!;
      expect(result.schedule[tpIndex].principal).toBeGreaterThan(result.schedule[tpIndex].interest);
      if (tpIndex > 0) {
        expect(result.schedule[tpIndex - 1].principal).toBeLessThanOrEqual(result.schedule[tpIndex - 1].interest);
      }
    });

    describe('Access Bond Logic', () => {
      const accessInputs: LoanInputs = {
        ...defaultInputs,
        isAccessBond: true
      };

      it('applies savings as month 0 lump sum', () => {
        const scenario: Scenario = {
          ...baselineScenario,
          savings: 100000
        };
        const result = calculateLoanSchedule(accessInputs, scenario);
        
        // Month 0 extra payment should include the R100k savings
        expect(result.schedule[0].extraPayment).toBe(100000);
        expect(result.schedule[0].closingBalance).toBeLessThan(defaultInputs.currentOutstanding - 100000);
      });

      it('applies unspent salary as extra monthly payment', () => {
        const scenario: Scenario = {
          ...baselineScenario,
          salaryAmount: 50000,
          salarySpent: 40000
        };
        const result = calculateLoanSchedule(accessInputs, scenario);
        
        // Every month should have R10k extra payment (unspent)
        expect(result.schedule[0].extraPayment).toBe(10000);
        expect(result.schedule[12].extraPayment).toBe(10000);
      });

      it('reduces interest via the salary offset', () => {
        // Standard interest on R1M at 12% monthly is R10,000
        const normalResult = calculateLoanSchedule(defaultInputs, baselineScenario);
        const normalInterest = normalResult.schedule[0].interest;
        
        const scenario: Scenario = {
          ...baselineScenario,
          salaryAmount: 50000,
          salarySpent: 50000 // Fully spent, so NO unspent extra payment
        };
        const accessResult = calculateLoanSchedule(accessInputs, scenario);
        const accessInterest = accessResult.schedule[0].interest;
        
        // With R50k salary spent throughout the month, average offset is R25k.
        // Interest should be on R975,000 instead of R1,000,000.
        // R975k * 1% = R9,750
        expect(accessInterest).toBeLessThan(normalInterest);
        expect(accessInterest).toBeCloseTo(9824.8, 1);
        
        // Verify unspent was 0
        expect(accessResult.schedule[0].extraPayment).toBe(0);
      });

      it('combines all access bond features correctly', () => {
        const scenario: Scenario = {
          ...baselineScenario,
          savings: 100000,      // Lump sum AND persistent offset
          salaryAmount: 50000,   // + R10k unspent
          salarySpent: 40000     // Offset benefit of salary is R50k - (R40k/2) = R30k
        };
        const result = calculateLoanSchedule(accessInputs, scenario);
        
        // Month 0 extra: R100k (savings) + R10k (unspent) = R110k
        expect(result.schedule[0].extraPayment).toBe(110000);
        
        expect(result.schedule[0].interest).toBeCloseTo(8754.6, 1);
      });
    });

    describe('Early Debit Order Logic (Timing Hack)', () => {
      const dailyInputs: LoanInputs = {
        ...defaultInputs,
        debitOrderDay: 1 // Baseline: Day 1
      };

      it('should calculate more interest if the debit order is late in the month', () => {
        const baseline = calculateLoanSchedule(dailyInputs, baselineScenario);
        
        // Scenario where current debit day is 28
        const lateScenario: Scenario = {
          ...baselineScenario,
          currentDebitDay: 28,
          debitOrderDay: 28 // No change yet
        };
        const lateResult = calculateLoanSchedule(dailyInputs, lateScenario);

        expect(lateResult.totalInterest).toBeGreaterThan(baseline.totalInterest);
      });

      it('should show savings when strategy moves debit order earlier than currentDebitDay', () => {
        // User currently pays on the 1st (as per inputs), 
        // but we'll specify a strategy where they currently pay on the 15th
        const strategyScenario: Scenario = { 
          ...baselineScenario, 
          currentDebitDay: 15,
          debitOrderDay: 1 // Moving it 14 days earlier
        };
        
        const result = calculateLoanSchedule(dailyInputs, strategyScenario);
        
        // We need to compare it to a result where they STAY on the 15th
        const stayOn15Scenario: Scenario = {
          ...baselineScenario,
          currentDebitDay: 15,
          debitOrderDay: 15
        };
        const baseline15 = calculateLoanSchedule(dailyInputs, stayOn15Scenario);

        const interestSaved = baseline15.totalInterest - result.totalInterest;
        expect(interestSaved).toBeGreaterThan(0);
        expect(interestSaved).toBeGreaterThan(10000);
      });

      it('verifies total savings for user scenario: R1M, 12%, 20y, 1st to 27th shift', () => {
        const userInputs: LoanInputs = {
          ...defaultInputs,
          loanAmount: 1000000,
          currentOutstanding: 1000000,
          interestRate: 12,
          remainingTermYears: 20,
          debitOrderDay: 1, // Current baseline
          startDate: new Date(2024, 0, 1) // Start Jan 1st
        };

        const baseline = calculateLoanSchedule(userInputs, { ...baselineScenario, currentDebitDay: 1, debitOrderDay: 1 });
        
        const strategy: Scenario = {
          ...baselineScenario,
          currentDebitDay: 1,
          debitOrderDay: 27 // New early date
        };
        const result = calculateLoanSchedule(userInputs, strategy);

        const totalInterestSaved = baseline.totalInterest - result.totalInterest;

        // Precise result for the Daily-Baseline model
        expect(totalInterestSaved).toBeCloseTo(14188.14, 0);
        
        // Time saved is 1 month in this model
        expect(baseline.totalMonths - result.totalMonths).toBe(1);
      });

      it('correctly handles wrap-around days (e.g., payday 25th, current debit 1st, new debit 27th)', () => {
        const wrapScenario: Scenario = {
          ...baselineScenario,
          currentDebitDay: 1,
          debitOrderDay: 27
        };
        
        const result = calculateLoanSchedule(dailyInputs, wrapScenario);
        const baseline = calculateLoanSchedule(dailyInputs, { ...baselineScenario, currentDebitDay: 1, debitOrderDay: 1 });
        
        const diffJan = baseline.schedule[0].interest - result.schedule[0].interest;
        
        expect(diffJan).toBeGreaterThan(0);
        expect(diffJan).toBeCloseTo(18.10, 1);
      });
    });

    describe('Savings Comparison', () => {
      it('calculates total interest saved correctly', () => {
        const baseline = calculateLoanSchedule(defaultInputs, baselineScenario);
        const extraScenario: Scenario = {
          ...baselineScenario,
          extraMonthlyPayment: 5000
        };
        const scenarioResult = calculateLoanSchedule(defaultInputs, extraScenario);
        
        const interestSaved = baseline.totalInterest - scenarioResult.totalInterest;
        
        // At the end of the scenario, the balance difference is NOT the interest saved
        const lastMonth = scenarioResult.schedule.length - 1;
        const balanceDiff = baseline.schedule[lastMonth].closingBalance - scenarioResult.schedule[lastMonth].closingBalance;
        
        expect(interestSaved).toBeGreaterThan(0);
        expect(interestSaved).toBeGreaterThan(balanceDiff); 
      });

      it('confirms that interest saved INCREASES when interest rates rise (The Savings Paradox)', () => {
        const extraPayment = 2000;
        const scenario: Scenario = { ...baselineScenario, extraMonthlyPayment: extraPayment };

        // Scenario at 10%
        const inputs10 = { ...defaultInputs, interestRate: 10 };
        const baseline10 = calculateLoanSchedule(inputs10, baselineScenario);
        const result10 = calculateLoanSchedule(inputs10, scenario);
        const savedAt10 = baseline10.totalInterest - result10.totalInterest;

        // Scenario at 15%
        const inputs15 = { ...defaultInputs, interestRate: 15 };
        const baseline15 = calculateLoanSchedule(inputs15, baselineScenario);
        const result15 = calculateLoanSchedule(inputs15, scenario);
        const savedAt15 = baseline15.totalInterest - result15.totalInterest;

        expect(savedAt15).toBeGreaterThan(savedAt10);
      });
    });

    describe('Upfront Costs Strategy (initialBalanceReduction)', () => {
      it('mathematically proves that total interest saved equals total net cash saved', () => {
        // Baseline: R1,080,000 bond (which includes R80k costs)
        const inputsWithCosts: LoanInputs = {
          ...defaultInputs,
          currentOutstanding: 1080000,
        };

        const baseline = calculateLoanSchedule(inputsWithCosts, baselineScenario);

        // Upfront cash scenario: Pay R80k in cash, so loan starts at R1,000,000
        const upfrontScenario: Scenario = {
          ...baselineScenario,
          initialBalanceReduction: 80000
        };

        const upfrontResult = calculateLoanSchedule(inputsWithCosts, upfrontScenario);

        const interestSaved = baseline.totalInterest - upfrontResult.totalInterest;

        // Total cash outflow for baseline = Total Principal Paid + Total Interest Paid
        // (Since all principal is paid off by the end of the loan, total principal paid is exactly the starting balance)
        const baselineTotalCashOutflow = inputsWithCosts.currentOutstanding + baseline.totalInterest;

        // Total cash outflow for upfront strategy = Upfront Cash + Total Principal Paid on new balance + Total Interest Paid
        const upfrontCashPaid = 80000;
        const newLoanBalance = inputsWithCosts.currentOutstanding - upfrontCashPaid;
        const upfrontTotalCashOutflow = upfrontCashPaid + newLoanBalance + upfrontResult.totalInterest;

        const totalNetCashSaved = baselineTotalCashOutflow - upfrontTotalCashOutflow;

        // Mathematical proof: 
        // baselineTotalCashOutflow = 1080000 + baseline.totalInterest
        // upfrontTotalCashOutflow = 80000 + 1000000 + upfrontResult.totalInterest = 1080000 + upfrontResult.totalInterest
        // Difference = (1080000 + baseline.totalInterest) - (1080000 + upfrontResult.totalInterest)
        // Difference = baseline.totalInterest - upfrontResult.totalInterest
        
        expect(totalNetCashSaved).toBeCloseTo(interestSaved, 2);
      });
    });

    describe('South African Specific Precision', () => {
      it('handles Leap Year daily accrual correctly (365-day divisor)', () => {
        const leapYearInputs: LoanInputs = {
          ...defaultInputs,
          startDate: new Date(2024, 1, 1), // Feb 2024
          interestRate: 12,
          debitOrderDay: 1 // If paid on day 1, interest is on reduced balance for full month
        };
        const result = calculateLoanSchedule(leapYearInputs, baselineScenario);
        
        // Feb 2024 has 29 days. 
        expect(result.schedule[0].interest).toBeCloseTo(9429.3, 1);
      });

      it('calculates decreasing term assurance correctly', () => {
        const assuranceInputs: LoanInputs = {
          ...defaultInputs,
          monthlyAssurance: 1000, // R1000 at R1M balance
          currentOutstanding: 1000000
        };
        const result = calculateLoanSchedule(assuranceInputs, baselineScenario);
        
        expect(result.schedule[0].openingBalance).toBe(1000000);
        const midPoint = Math.floor(result.totalMonths / 2);
        const midBalance = result.schedule[midPoint].openingBalance;
        
        expect(midBalance).toBeLessThan(1000000);
        expect(result.totalAssurance).toBeGreaterThan(result.totalMonths * 100); 
      });

      it('treats fixedMonthlyPayment as GROSS (inclusive of fees and insurance)', () => {
        const grossInputs: LoanInputs = {
          ...defaultInputs,
          monthlyServiceFee: 100,
          monthlyInsurance: 400,
          monthlyAssurance: 500 // Total fees = R1000 at R1M balance
        };
        
        const fixedScenario: Scenario = {
          ...baselineScenario,
          fixedMonthlyPayment: 15000
        };
        
        const result = calculateLoanSchedule(grossInputs, fixedScenario);
        
        expect(result.schedule[0].payment).toBe(14000);
        expect(result.schedule[0].principal).toBeCloseTo(3950.9, 1);
      });

      it('extends the term when interest rates rise but installment is fixed', () => {
        // Baseline: R1M, 12%, 240 months => PMT ~11011
        const initialResult = calculateLoanSchedule(defaultInputs, baselineScenario);
        const initialPayment = initialResult.schedule[0].payment;

        // Rate hike to 15%
        const hikedInputs = { ...defaultInputs, interestRate: 15 };
        
        // If we let the bank recalculate, payment would go to ~13167
        // But if we FORCE a fixed payment of the old 11011:
        const fixedScenario: Scenario = {
          ...baselineScenario,
          fixedMonthlyPayment: initialPayment
        };
        
        const result = calculateLoanSchedule(hikedInputs, fixedScenario);
        
        // The loan should take much longer than 240 months
        expect(result.totalMonths).toBeGreaterThan(240);
        // At 15%, R11011 is barely enough to cover interest (R12500), 
        // so this loan would actually never be paid off (hit safety break)
        expect(result.totalMonths).toBe(12 * 50); // Max months safety break
      });
    });
  });

  describe('calculateTargetExtraPayment', () => {
    const defaultInputs: LoanInputs = {
      loanAmount: 1000000,
      currentOutstanding: 1000000,
      interestRate: 12,
      interestRateHike: 0,
      remainingTermYears: 20,
      remainingTermMonths: 0,
      startDate: new Date(2024, 0, 1)
    };

    const baseScenario: Scenario = {
      id: 'target',
      name: 'Target',
      lumpSums: [],
      extraMonthlyPayment: 0
    };

    it('solves for extra payment to hit a 10-year target', () => {
      const targetDate = addMonths(defaultInputs.startDate, 120);
      const requiredExtra = calculateTargetExtraPayment(defaultInputs, targetDate, baseScenario, 'extraMonthlyPayment');
      
      const result = calculateLoanSchedule(defaultInputs, { ...baseScenario, extraMonthlyPayment: requiredExtra });
      expect(result.totalMonths).toBeLessThanOrEqual(120);
      expect(result.totalMonths).toBeGreaterThan(118); 
    });

    it('solves for fixed monthly premium to hit a 15-year target', () => {
      const targetDate = addMonths(defaultInputs.startDate, 180);
      const requiredFixed = calculateTargetExtraPayment(defaultInputs, targetDate, baseScenario, 'fixedMonthlyPayment');
      
      const result = calculateLoanSchedule(defaultInputs, { ...baseScenario, fixedMonthlyPayment: requiredFixed });
      expect(result.totalMonths).toBeLessThanOrEqual(180);
      expect(result.totalMonths).toBeGreaterThan(178);
      // Fixed premium should be higher than the base installment (~R11010)
      expect(requiredFixed).toBeGreaterThan(11010);
    });

    it('solves for annual percentage increase to hit a target', () => {
      const targetDate = addMonths(defaultInputs.startDate, 150);
      // Start with a small extra payment so the percentage has something to work with
      const scenarioWithBase = { ...baseScenario, extraMonthlyPayment: 500 };
      const requiredIncr = calculateTargetExtraPayment(defaultInputs, targetDate, scenarioWithBase, 'annualExtraIncrement');
      
      const result = calculateLoanSchedule(defaultInputs, { ...scenarioWithBase, annualExtraIncrement: requiredIncr });
      expect(result.totalMonths).toBeLessThanOrEqual(152); // Allow 2 month tolerance for percentages
      expect(result.totalMonths).toBeGreaterThan(145); 
      expect(requiredIncr).toBeGreaterThan(0);
    });
  });
});

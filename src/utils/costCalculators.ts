export interface PropertyCosts {
  transferDuty: number;
  conveyancingFees: number;
  bondRegistrationFees: number;
  vatOnFees: number;
  totalCosts: number;
  bankInitiationFee: number;
}

/**
 * Calculates South African Property Transfer & Bond Costs
 * Based on 2024/2025 SARS Transfer Duty Tables and estimated Law Society guidelines.
 */
export function calculatePropertyCosts(propertyValue: number, bondAmount: number): PropertyCosts {
  // 1. Transfer Duty (SARS 2024/2025)
  let transferDuty = 0;
  if (propertyValue <= 1100000) {
    transferDuty = 0;
  } else if (propertyValue <= 1512500) {
    transferDuty = (propertyValue - 1100000) * 0.03;
  } else if (propertyValue <= 2117500) {
    transferDuty = 12375 + (propertyValue - 1512500) * 0.06;
  } else if (propertyValue <= 2722500) {
    transferDuty = 48675 + (propertyValue - 2117500) * 0.08;
  } else if (propertyValue <= 12100000) {
    transferDuty = 97075 + (propertyValue - 2722500) * 0.11;
  } else {
    transferDuty = 1128600 + (propertyValue - 12100000) * 0.13;
  }

  // 2. Estimated Conveyancing Fees (Transfer) - Sliding scale averages
  let conveyancingFees = 0;
  if (propertyValue <= 100000) conveyancingFees = 6000;
  else if (propertyValue <= 500000) conveyancingFees = 14000;
  else if (propertyValue <= 1000000) conveyancingFees = 22000;
  else if (propertyValue <= 2000000) conveyancingFees = 32000;
  else if (propertyValue <= 5000000) conveyancingFees = 55000;
  else conveyancingFees = 80000;

  // 3. Estimated Bond Registration Fees
  let bondRegistrationFees = 0;
  if (bondAmount > 0) {
    if (bondAmount <= 500000) bondRegistrationFees = 12000;
    else if (bondAmount <= 1000000) bondRegistrationFees = 18000;
    else if (bondAmount <= 2000000) bondRegistrationFees = 26000;
    else bondRegistrationFees = 40000;
  }

  // 4. Bank Initiation Fee (NCA Capped 2024)
  const bankInitiationFee = bondAmount > 0 ? 6037.50 : 0;

  const vatOnFees = (conveyancingFees + bondRegistrationFees) * 0.15;
  const totalCosts = transferDuty + conveyancingFees + bondRegistrationFees + vatOnFees + bankInitiationFee;

  return {
    transferDuty,
    conveyancingFees,
    bondRegistrationFees,
    vatOnFees,
    totalCosts,
    bankInitiationFee
  };
}

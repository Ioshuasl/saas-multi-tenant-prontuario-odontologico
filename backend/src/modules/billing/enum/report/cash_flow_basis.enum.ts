export const CASH_FLOW_BASES = ['CASH', 'ACCRUAL'] as const;

export type CashFlowBasis = (typeof CASH_FLOW_BASES)[number];

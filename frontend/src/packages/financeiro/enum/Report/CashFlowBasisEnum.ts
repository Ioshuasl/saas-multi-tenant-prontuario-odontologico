export const CASH_FLOW_BASES = ['CASH', 'ACCRUAL'] as const;

export type CashFlowBasis = (typeof CASH_FLOW_BASES)[number];

export const CASH_FLOW_BASIS_LABELS: Record<CashFlowBasis, string> = {
  CASH: 'Caixa (regime de caixa)',
  ACCRUAL: 'Competência',
};

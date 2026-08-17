export const CASH_MOVEMENT_KINDS = ['SUPPLY', 'WITHDRAWAL'] as const;

export type CashMovementKind = (typeof CASH_MOVEMENT_KINDS)[number];

export const CASH_MOVEMENT_KIND_LABELS: Record<CashMovementKind, string> = {
  SUPPLY: 'Suprimento',
  WITHDRAWAL: 'Sangria',
};

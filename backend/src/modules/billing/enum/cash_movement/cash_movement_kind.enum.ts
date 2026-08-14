export const CASH_MOVEMENT_KINDS = [
  'SUPPLY',
  'WITHDRAWAL',
  'PAYMENT_IN',
  'PAYMENT_OUT',
] as const;

export type CashMovementKind = (typeof CASH_MOVEMENT_KINDS)[number];

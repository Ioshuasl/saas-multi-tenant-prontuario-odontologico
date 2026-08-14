export const INSTALLMENT_STATUSES = [
  'OPEN',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED',
] as const;

export type InstallmentStatus = (typeof INSTALLMENT_STATUSES)[number];

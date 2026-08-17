export const INSTALLMENT_STATUSES = [
  'OPEN',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED',
] as const;

export type InstallmentStatus = (typeof INSTALLMENT_STATUSES)[number];

export const INSTALLMENT_STATUS_LABELS: Record<InstallmentStatus, string> = {
  OPEN: 'Em aberto',
  PARTIALLY_PAID: 'Parcial',
  PAID: 'Paga',
  OVERDUE: 'Em atraso',
  CANCELLED: 'Cancelada',
};

export const INSTALLMENT_PAYABLE_STATUSES: InstallmentStatus[] = [
  'OPEN',
  'PARTIALLY_PAID',
  'OVERDUE',
];

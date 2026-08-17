export const PAYABLE_STATUSES = ['OPEN', 'PAID', 'OVERDUE', 'CANCELLED'] as const;

export type PayableStatus = (typeof PAYABLE_STATUSES)[number];

export const PAYABLE_STATUS_LABELS: Record<PayableStatus, string> = {
  OPEN: 'Em aberto',
  PAID: 'Pago',
  OVERDUE: 'Em atraso',
  CANCELLED: 'Cancelado',
};

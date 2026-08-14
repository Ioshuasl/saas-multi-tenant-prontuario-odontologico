export const INSTALLMENT_STATUSES = ['OPEN', 'PAID', 'OVERDUE', 'CANCELLED'] as const;

export type InstallmentStatus = (typeof INSTALLMENT_STATUSES)[number];

export const RECEIVABLE_STATUSES = ['OPEN', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'] as const;

export type ReceivableStatus = (typeof RECEIVABLE_STATUSES)[number];

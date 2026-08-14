export const PAYABLE_STATUSES = ['OPEN', 'PAID', 'OVERDUE', 'CANCELLED'] as const;

export type PayableStatus = (typeof PAYABLE_STATUSES)[number];

export const CASH_SESSION_STATUSES = ['OPEN', 'CLOSED'] as const;

export type CashSessionStatus = (typeof CASH_SESSION_STATUSES)[number];

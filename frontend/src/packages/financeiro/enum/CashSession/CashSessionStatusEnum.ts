export const CASH_SESSION_STATUSES = ['OPEN', 'CLOSED'] as const;

export type CashSessionStatus = (typeof CASH_SESSION_STATUSES)[number];

export const CASH_SESSION_STATUS_LABELS: Record<CashSessionStatus, string> = {
  OPEN: 'Aberto',
  CLOSED: 'Fechado',
};

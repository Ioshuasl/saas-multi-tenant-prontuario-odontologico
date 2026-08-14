export const QUOTE_STATUSES = [
  'DRAFT',
  'SENT',
  'APPROVED',
  'PARTIALLY_APPROVED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: 'Rascunho',
  SENT: 'Enviado',
  APPROVED: 'Aprovado',
  PARTIALLY_APPROVED: 'Aprovado parcialmente',
  REJECTED: 'Recusado',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
};

export const QUOTE_DUPLICATE_STATUSES: readonly QuoteStatus[] = [
  'SENT',
  'EXPIRED',
  'REJECTED',
  'PARTIALLY_APPROVED',
];

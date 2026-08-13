export const WAITLIST_STATUSES = [
  'WAITING',
  'OFFERED',
  'SCHEDULED',
  'EXPIRED',
  'CANCELLED',
] as const;

export type WaitlistStatus = (typeof WAITLIST_STATUSES)[number];

export const WAITLIST_STATUS_LABELS: Record<WaitlistStatus, string> = {
  WAITING: 'Na fila',
  OFFERED: 'Oferta enviada',
  SCHEDULED: 'Agendado',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
};

export const WAITLIST_WEEKDAYS = [
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
] as const;

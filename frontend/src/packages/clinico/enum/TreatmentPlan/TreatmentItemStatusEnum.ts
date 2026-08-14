export const TREATMENT_ITEM_STATUSES = [
  'PLANNED',
  'SCHEDULED',
  'EXECUTED',
  'CANCELLED',
] as const;

export type TreatmentItemStatus = (typeof TREATMENT_ITEM_STATUSES)[number];

export const TREATMENT_ITEM_STATUS_LABELS: Record<TreatmentItemStatus, string> = {
  PLANNED: 'Planejado',
  SCHEDULED: 'Agendado',
  EXECUTED: 'Executado',
  CANCELLED: 'Cancelado',
};

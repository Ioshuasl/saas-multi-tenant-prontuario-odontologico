export const TREATMENT_ITEM_STATUSES = [
  'PLANNED',
  'SCHEDULED',
  'EXECUTED',
  'CANCELLED',
] as const;

export type TreatmentItemStatus = (typeof TREATMENT_ITEM_STATUSES)[number];

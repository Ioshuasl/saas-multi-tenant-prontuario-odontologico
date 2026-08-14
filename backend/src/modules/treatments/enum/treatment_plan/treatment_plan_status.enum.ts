export const TREATMENT_PLAN_STATUSES = ['ACTIVE', 'COMPLETED', 'CANCELLED'] as const;

export type TreatmentPlanStatus = (typeof TREATMENT_PLAN_STATUSES)[number];

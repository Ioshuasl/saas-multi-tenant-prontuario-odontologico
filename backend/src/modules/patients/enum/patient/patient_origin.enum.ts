export const PATIENT_ORIGINS = ['INTERNAL', 'PUBLIC_BOOKING'] as const;

export type PatientOrigin = (typeof PATIENT_ORIGINS)[number];

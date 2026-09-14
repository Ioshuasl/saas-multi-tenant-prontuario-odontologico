export const PATIENT_SEX_VALUES = ['M', 'F'] as const;

export type PatientSex = (typeof PATIENT_SEX_VALUES)[number];

export const PATIENT_SEX_LABELS: Record<PatientSex, string> = {
  M: 'Masculino',
  F: 'Feminino',
};

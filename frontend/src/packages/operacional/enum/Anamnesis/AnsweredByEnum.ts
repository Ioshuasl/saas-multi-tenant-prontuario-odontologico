export const ANSWERED_BY = ['PATIENT', 'PROFESSIONAL'] as const;

export type AnsweredBy = (typeof ANSWERED_BY)[number];

export const ANSWERED_BY_LABELS: Record<AnsweredBy, string> = {
  PATIENT: 'Paciente',
  PROFESSIONAL: 'Profissional',
};

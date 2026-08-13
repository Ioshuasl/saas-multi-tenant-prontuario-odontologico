export const ANSWERED_BY = ['PATIENT', 'PROFESSIONAL'] as const;

export type AnsweredBy = (typeof ANSWERED_BY)[number];

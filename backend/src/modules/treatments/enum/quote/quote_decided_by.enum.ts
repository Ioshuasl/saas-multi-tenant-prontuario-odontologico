export const QUOTE_DECIDED_BY = ['USER', 'PATIENT_LINK'] as const;

export type QuoteDecidedBy = (typeof QUOTE_DECIDED_BY)[number];

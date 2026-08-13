export const ALERT_CATEGORIES = ['ALLERGY', 'CONDITION', 'MEDICATION', 'OTHER'] as const;

export type AlertCategory = (typeof ALERT_CATEGORIES)[number];

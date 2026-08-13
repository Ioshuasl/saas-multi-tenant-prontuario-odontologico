export const ALERT_SOURCES = ['ANAMNESIS', 'MANUAL'] as const;

export type AlertSource = (typeof ALERT_SOURCES)[number];

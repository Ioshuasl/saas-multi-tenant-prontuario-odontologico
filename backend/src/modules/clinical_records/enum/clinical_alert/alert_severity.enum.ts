export const ALERT_SEVERITIES = ['INFO', 'WARNING', 'CRITICAL'] as const;

export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

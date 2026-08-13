export const AUTOMATION_KEYS = ['CONFIRMATION_D1', 'REMINDER_H3', 'WAITLIST_OFFER'] as const;

export type AutomationKey = (typeof AUTOMATION_KEYS)[number];

export const AUTOMATION_RUN_RESULTS = [
  'SENT',
  'SKIPPED_NO_CONSENT',
  'SKIPPED_NO_CREDIT',
  'SKIPPED_CANCELLED',
  'SKIPPED_REQUESTED',
  'SKIPPED_KILL_SWITCH',
  'SKIPPED_NO_ACCOUNT',
  'FAILED',
] as const;

export type AutomationRunResult = (typeof AUTOMATION_RUN_RESULTS)[number];

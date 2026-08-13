export const WAITLIST_STATUSES = [
  'WAITING',
  'OFFERED',
  'SCHEDULED',
  'EXPIRED',
  'CANCELLED',
] as const;

export type WaitlistStatus = (typeof WAITLIST_STATUSES)[number];

export const WAITLIST_PRIORITIES = [0, 1] as const;

export type WaitlistPriority = (typeof WAITLIST_PRIORITIES)[number];

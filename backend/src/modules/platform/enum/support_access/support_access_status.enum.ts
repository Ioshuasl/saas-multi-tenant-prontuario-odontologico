export const SUPPORT_ACCESS_STATUSES = ['PENDING', 'APPROVED', 'DENIED'] as const;

export type SupportAccessStatus = (typeof SUPPORT_ACCESS_STATUSES)[number];

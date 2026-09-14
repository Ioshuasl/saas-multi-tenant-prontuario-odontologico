export const DSR_STATUSES = ['RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'] as const;

export type DsrStatus = (typeof DSR_STATUSES)[number];

export const DSR_TERMINAL_STATUSES: readonly DsrStatus[] = ['COMPLETED', 'REJECTED'];

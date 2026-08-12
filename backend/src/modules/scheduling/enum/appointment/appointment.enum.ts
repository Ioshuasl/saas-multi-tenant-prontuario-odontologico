export const APPOINTMENT_STATUSES = [
  'REQUESTED',
  'SCHEDULED',
  'CONFIRMED',
  'IN_SERVICE',
  'COMPLETED',
  'NO_SHOW',
  'CANCELLED',
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_ORIGINS = [
  'INTERNAL',
  'PUBLIC_BOOKING',
  'WAITLIST',
  'RECURRENCE',
] as const;

export type AppointmentOrigin = (typeof APPOINTMENT_ORIGINS)[number];

export const HISTORY_ACTIONS = [
  'CREATED',
  'RESCHEDULED',
  'STATUS_CHANGED',
  'CANCELLED',
] as const;

export type HistoryAction = (typeof HISTORY_ACTIONS)[number];

export const SERIES_DELETE_SCOPES = ['THIS', 'FUTURE', 'ALL'] as const;

export type SeriesDeleteScope = (typeof SERIES_DELETE_SCOPES)[number];

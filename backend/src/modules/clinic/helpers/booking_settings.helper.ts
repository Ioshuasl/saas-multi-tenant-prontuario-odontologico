export type BookingSettings = {
  minLeadMinutes: number;
  maxLeadDays: number;
  publicStatus: 'REQUESTED' | 'SCHEDULED';
  courtesyTransactionalMessages: number;
};

export const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  minLeadMinutes: 120,
  maxLeadDays: 60,
  publicStatus: 'REQUESTED',
  courtesyTransactionalMessages: 50,
};

export function parseBookingSettings(raw: unknown): BookingSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_BOOKING_SETTINGS };
  const value = raw as Record<string, unknown>;
  const minLeadMinutes =
    typeof value.minLeadMinutes === 'number' && value.minLeadMinutes >= 0
      ? value.minLeadMinutes
      : DEFAULT_BOOKING_SETTINGS.minLeadMinutes;
  const maxLeadDays =
    typeof value.maxLeadDays === 'number' && value.maxLeadDays >= 1
      ? value.maxLeadDays
      : DEFAULT_BOOKING_SETTINGS.maxLeadDays;
  const publicStatus =
    value.publicStatus === 'SCHEDULED' || value.publicStatus === 'REQUESTED'
      ? value.publicStatus
      : DEFAULT_BOOKING_SETTINGS.publicStatus;
  const courtesyTransactionalMessages =
    typeof value.courtesyTransactionalMessages === 'number'
      ? value.courtesyTransactionalMessages
      : DEFAULT_BOOKING_SETTINGS.courtesyTransactionalMessages;
  return { minLeadMinutes, maxLeadDays, publicStatus, courtesyTransactionalMessages };
}

export const BOOKING_STEPS = [
  'procedure',
  'professional',
  'slot',
  'identity',
  'otp',
  'success',
] as const;

export type BookingStep = (typeof BOOKING_STEPS)[number];

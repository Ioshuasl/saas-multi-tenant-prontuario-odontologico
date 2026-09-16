export const BOOKING_STEPS = [
  'professional',
  'slot',
  'identity',
  'otp',
  'success',
] as const;

export type BookingStep = (typeof BOOKING_STEPS)[number];

/** Valor sentinela: qualquer profissional disponível no horário. */
export const BOOKING_ANY_PROFESSIONAL = 'any';

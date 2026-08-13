export const PUBLIC_BOOKING_TOKEN_PURPOSES = [
  'BOOKING',
  'CONFIRMATION',
  'WAITLIST_OFFER',
] as const;

export type PublicBookingTokenPurpose = (typeof PUBLIC_BOOKING_TOKEN_PURPOSES)[number];

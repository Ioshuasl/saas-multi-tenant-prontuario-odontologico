export const BOOKING_OTP_CHANNELS = ['EMAIL', 'WHATSAPP'] as const;

export type BookingOtpChannel = (typeof BOOKING_OTP_CHANNELS)[number];

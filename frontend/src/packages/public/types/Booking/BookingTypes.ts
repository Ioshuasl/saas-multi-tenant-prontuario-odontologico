import type { BookingOtpChannel } from '@/packages/public/enum/Booking/BookingOtpChannelEnum';

export type BookingProcedureOption = {
  id: string;
  name: string;
  defaultMinutes: number;
};

export type BookingProfessionalOption = {
  id: string;
  name: string;
};

export type BookingClinic = {
  name: string;
  slug: string;
  timezone: string;
  procedures: BookingProcedureOption[];
  professionals: BookingProfessionalOption[];
};

export type BookingAvailabilitySlot = {
  startsAt: string;
  endsAt: string;
  available: boolean;
  reason?: 'BOOKED' | 'BLOCKED' | 'OUT_OF_HOURS';
};

export type BookingAvailabilityDay = {
  date: string;
  timezone: string;
  slotMinutes: number;
  slots: BookingAvailabilitySlot[];
};

export type BookingAvailability = {
  timezone: string;
  days: BookingAvailabilityDay[];
};

export type BookingAvailabilityQuery = {
  slug: string;
  procedureId: string;
  professionalId: string;
  from?: string;
  to?: string;
};

export type BookingCreateInput = {
  slug: string;
  procedureId: string;
  professionalId: string;
  startsAt: string;
  name: string;
  phone: string;
  email?: string | null;
  consentDataProcessing: boolean;
  consentTerms: boolean;
  consentWhatsappMarketing: boolean;
};

export type BookingCreateResult = {
  bookingId: string;
  otpSentVia: BookingOtpChannel;
  expiresInSeconds: number;
  debugOtp?: string;
};

export type BookingVerifyInput = {
  slug: string;
  bookingId: string;
  code: string;
};

export type BookingVerifyResult = {
  appointment: {
    id: string;
    status: string;
    origin: string;
    startsAt: string;
    endsAt: string;
    professionalId: string;
    procedureId: string | null;
  };
  patient: {
    id: string;
    name: string;
    phonePrimary: string;
    origin: string;
    needsDataReview: boolean;
  };
  confirmationToken?: string;
};

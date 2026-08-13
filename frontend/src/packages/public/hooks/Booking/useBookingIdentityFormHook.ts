'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BookingIdentitySchema,
  type BookingIdentityFormValues,
} from '@/packages/public/schemas/Booking/BookingSchema';

export function useBookingIdentityFormHook() {
  return useForm<BookingIdentityFormValues>({
    resolver: zodResolver(BookingIdentitySchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      consentDataProcessing: false,
      consentTerms: false,
      consentWhatsappMarketing: false,
    },
  });
}

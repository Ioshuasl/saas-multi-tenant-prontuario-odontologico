'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BookingOtpSchema,
  type BookingOtpFormValues,
} from '@/packages/public/schemas/Booking/BookingSchema';

export function useBookingOtpFormHook() {
  return useForm<BookingOtpFormValues>({
    resolver: zodResolver(BookingOtpSchema),
    defaultValues: { code: '' },
  });
}

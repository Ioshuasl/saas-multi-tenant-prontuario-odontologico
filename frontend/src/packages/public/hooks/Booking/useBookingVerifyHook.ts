'use client';

import { useMutation } from '@tanstack/react-query';
import { BookingVerifyService } from '@/packages/public/services/Booking/BookingVerifyService';

export function useBookingVerifyHook() {
  return useMutation({
    mutationFn: BookingVerifyService,
  });
}

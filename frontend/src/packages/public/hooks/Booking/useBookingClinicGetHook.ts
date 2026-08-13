'use client';

import { useQuery } from '@tanstack/react-query';
import { publicQueryKeys } from '@/packages/public/helpers/PublicQueryKeys';
import { BookingClinicGetService } from '@/packages/public/services/Booking/BookingClinicGetService';

export function useBookingClinicGetHook(slug: string) {
  return useQuery({
    queryKey: publicQueryKeys.clinic(slug),
    queryFn: () => BookingClinicGetService(slug),
    enabled: Boolean(slug),
    retry: false,
  });
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { publicQueryKeys } from '@/packages/public/helpers/PublicQueryKeys';
import { BookingConfirmGetService } from '@/packages/public/services/BookingConfirm/BookingConfirmGetService';

export function useBookingConfirmGetHook(token: string) {
  return useQuery({
    queryKey: publicQueryKeys.confirm(token),
    queryFn: () => BookingConfirmGetService(token),
    enabled: Boolean(token),
    retry: false,
  });
}

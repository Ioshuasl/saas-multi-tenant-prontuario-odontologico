'use client';

import { useQuery } from '@tanstack/react-query';
import { publicQueryKeys } from '@/packages/public/helpers/PublicQueryKeys';
import { BookingAvailabilityGetService } from '@/packages/public/services/Booking/BookingAvailabilityGetService';

export function useBookingAvailabilityGetHook(input: {
  slug: string;
  procedureId: string;
  professionalId: string;
  from: string;
  to: string;
  enabled?: boolean;
}) {
  const enabled =
    Boolean(input.enabled ?? true) &&
    Boolean(input.slug && input.procedureId && input.professionalId && input.from && input.to);

  return useQuery({
    queryKey: publicQueryKeys.availability(
      input.slug,
      input.procedureId,
      input.professionalId,
      input.from,
      input.to,
    ),
    queryFn: () =>
      BookingAvailabilityGetService({
        slug: input.slug,
        procedureId: input.procedureId,
        professionalId: input.professionalId,
        from: input.from,
        to: input.to,
      }),
    enabled,
  });
}

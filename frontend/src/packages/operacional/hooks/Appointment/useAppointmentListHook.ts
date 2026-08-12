'use client';

import { useQuery } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { AppointmentListService } from '@/packages/operacional/services/Appointment/AppointmentListService';

export function useAppointmentListHook(input: {
  professionalId?: string;
  from?: string;
  to?: string;
  enabled?: boolean;
}) {
  const professionalId = input.professionalId ?? '';
  const from = input.from ?? '';
  const to = input.to ?? '';

  return useQuery({
    queryKey: operacionalQueryKeys.appointments(professionalId, from, to),
    queryFn: () =>
      AppointmentListService({
        professionalId,
        from,
        to,
      }),
    enabled: Boolean(input.enabled ?? true) && Boolean(professionalId && from && to),
  });
}

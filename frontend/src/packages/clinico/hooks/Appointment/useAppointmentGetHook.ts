'use client';

import { useQuery } from '@tanstack/react-query';
import { clinicoQueryKeys } from '@/packages/clinico/helpers/ClinicoQueryKeys';
import { AppointmentGetService } from '@/packages/clinico/services/Appointment/AppointmentGetService';

export function useAppointmentGetHook(appointmentId: string) {
  return useQuery({
    queryKey: clinicoQueryKeys.appointment(appointmentId),
    queryFn: () => AppointmentGetService(appointmentId),
    enabled: Boolean(appointmentId),
    retry: false,
  });
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { AgendaClinicSettingsService } from '@/packages/operacional/services/Appointment/AgendaClinicSettingsService';

export function useAgendaClinicSettingsHook() {
  return useQuery({
    queryKey: operacionalQueryKeys.agendaClinicSettings,
    queryFn: AgendaClinicSettingsService,
  });
}

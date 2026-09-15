'use client';

import { useQuery } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { AgendaChairListService } from '@/packages/operacional/services/Appointment/AgendaChairListService';

export function useAgendaChairListHook(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: operacionalQueryKeys.agendaChairs,
    queryFn: AgendaChairListService,
    enabled: options?.enabled ?? true,
  });
}

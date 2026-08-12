'use client';

import { useQuery } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { AgendaProfessionalListService } from '@/packages/operacional/services/Appointment/AgendaProfessionalListService';

export function useAgendaProfessionalListHook() {
  return useQuery({
    queryKey: operacionalQueryKeys.agendaProfessionals,
    queryFn: AgendaProfessionalListService,
  });
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { AnamnesisListService } from '@/packages/operacional/services/Anamnesis/AnamnesisListService';

export function useAnamnesisListHook(patientId: string | undefined) {
  return useQuery({
    queryKey: operacionalQueryKeys.anamnesis(patientId ?? ''),
    queryFn: () => AnamnesisListService(patientId!),
    enabled: Boolean(patientId),
  });
}

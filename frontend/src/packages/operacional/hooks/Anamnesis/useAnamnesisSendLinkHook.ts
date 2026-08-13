'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { AnamnesisSendLinkService } from '@/packages/operacional/services/Anamnesis/AnamnesisSendLinkService';

export function useAnamnesisSendLinkHook(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AnamnesisSendLinkService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: operacionalQueryKeys.anamnesis(patientId) });
      await queryClient.invalidateQueries({
        queryKey: operacionalQueryKeys.medicalRecord(patientId),
      });
    },
  });
}

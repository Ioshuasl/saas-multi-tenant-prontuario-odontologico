'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicoQueryKeys } from '@/packages/clinico/helpers/ClinicoQueryKeys';
import { OdontogramUpdateService } from '@/packages/clinico/services/Odontogram/OdontogramUpdateService';

export function useOdontogramUpdateHook(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: OdontogramUpdateService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: clinicoQueryKeys.odontogramRoot(patientId) });
    },
  });
}

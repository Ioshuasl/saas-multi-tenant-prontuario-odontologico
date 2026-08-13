'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { AnamnesisFormCreateService } from '@/packages/admin/services/AnamnesisForm/AnamnesisFormCreateService';

export function useAnamnesisFormCreateHook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AnamnesisFormCreateService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.anamnesisForms });
    },
  });
}

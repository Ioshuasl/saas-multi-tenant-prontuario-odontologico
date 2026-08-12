'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { ClinicUpdateService } from '@/packages/admin/services/Clinic/ClinicUpdateService';

export function useClinicUpdateHook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ClinicUpdateService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.clinic });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.onboarding });
    },
  });
}

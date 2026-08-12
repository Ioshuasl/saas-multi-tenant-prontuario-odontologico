'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProfessionalCreateInput } from '@/packages/admin/data/Professional/ProfessionalCreateData';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { ProfessionalCreateService } from '@/packages/admin/services/Professional/ProfessionalCreateService';

export function useProfessionalCreateHook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (professionalSchema: ProfessionalCreateInput) =>
      ProfessionalCreateService(professionalSchema),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.professionals });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.onboarding });
    },
  });
}

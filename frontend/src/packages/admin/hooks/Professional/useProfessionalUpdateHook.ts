'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProfessionalUpdateInput } from '@/packages/admin/data/Professional/ProfessionalUpdateData';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { ProfessionalUpdateService } from '@/packages/admin/services/Professional/ProfessionalUpdateService';

export function useProfessionalUpdateHook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      professionalId,
      professionalSchema,
    }: {
      professionalId: string;
      professionalSchema: ProfessionalUpdateInput;
    }) => ProfessionalUpdateService(professionalId, professionalSchema),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.professionals });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.onboarding });
    },
  });
}

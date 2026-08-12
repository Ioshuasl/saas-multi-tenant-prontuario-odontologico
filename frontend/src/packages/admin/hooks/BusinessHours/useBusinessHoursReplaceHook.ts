'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { BusinessHoursReplaceInput } from '@/packages/admin/data/BusinessHours/BusinessHoursReplaceData';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { BusinessHoursReplaceService } from '@/packages/admin/services/BusinessHours/BusinessHoursReplaceService';

export function useBusinessHoursReplaceHook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BusinessHoursReplaceInput) => BusinessHoursReplaceService(input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['business-hours', variables.unitId],
      });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.onboarding });
    },
  });
}

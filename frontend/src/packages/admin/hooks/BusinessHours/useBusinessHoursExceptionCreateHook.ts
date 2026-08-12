'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { BusinessHoursExceptionCreateInput } from '@/packages/admin/data/BusinessHours/BusinessHoursExceptionCreateData';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { BusinessHoursExceptionCreateService } from '@/packages/admin/services/BusinessHours/BusinessHoursExceptionCreateService';

export function useBusinessHoursExceptionCreateHook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BusinessHoursExceptionCreateInput) =>
      BusinessHoursExceptionCreateService(input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.businessHours(variables.unitId, variables.professionalId),
      });
    },
  });
}

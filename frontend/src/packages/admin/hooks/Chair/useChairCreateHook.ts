'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import type { ChairCreateFormValues } from '@/packages/admin/schemas/Chair/ChairSchema';
import { ChairCreateService } from '@/packages/admin/services/Chair/ChairCreateService';

export function useChairCreateHook(unitId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chairSchema: ChairCreateFormValues) => ChairCreateService(unitId, chairSchema),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.chairs(unitId) });
    },
  });
}

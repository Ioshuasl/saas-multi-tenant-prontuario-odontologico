'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import type { ChairUpdateFormValues } from '@/packages/admin/schemas/Chair/ChairSchema';
import { ChairUpdateService } from '@/packages/admin/services/Chair/ChairUpdateService';

export function useChairUpdateHook(unitId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chairId,
      chairSchema,
    }: {
      chairId: string;
      chairSchema: ChairUpdateFormValues;
    }) => ChairUpdateService(unitId, chairId, chairSchema),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.chairs(unitId) });
    },
  });
}

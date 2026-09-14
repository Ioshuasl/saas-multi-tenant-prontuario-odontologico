'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { DataSubjectRequestUpdateService } from '@/packages/admin/services/DataSubjectRequest/DataSubjectRequestUpdateService';
import type { DataSubjectRequestUpdateInput } from '@/packages/admin/types/DataSubjectRequest/DataSubjectRequestTypes';

export function useDataSubjectRequestUpdateHook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; dataSubjectRequestSchema: DataSubjectRequestUpdateInput }) =>
      DataSubjectRequestUpdateService(input.id, input.dataSubjectRequestSchema),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ['data-subject-requests'] });
      queryClient.setQueryData(adminQueryKeys.dataSubjectRequest(updated.id), updated);
    },
  });
}

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { DataSubjectRequestCreateService } from '@/packages/admin/services/DataSubjectRequest/DataSubjectRequestCreateService';

export function useDataSubjectRequestCreateHook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: DataSubjectRequestCreateService,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['data-subject-requests'] });
      queryClient.setQueryData(adminQueryKeys.dataSubjectRequest(created.id), created);
    },
  });
}

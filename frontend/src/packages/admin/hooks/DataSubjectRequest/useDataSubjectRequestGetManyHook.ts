'use client';

import { useQueries } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { DataSubjectRequestGetService } from '@/packages/admin/services/DataSubjectRequest/DataSubjectRequestGetService';
import type { DataSubjectRequest } from '@/packages/admin/types/DataSubjectRequest/DataSubjectRequestTypes';

export function useDataSubjectRequestGetManyHook(ids: string[], enabled = true) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: adminQueryKeys.dataSubjectRequest(id),
      queryFn: () => DataSubjectRequestGetService(id),
      enabled: enabled && Boolean(id),
      refetchInterval: (query: { state: { data?: DataSubjectRequest } }) => {
        const data = query.state.data;
        if (!data) return 3_000;
        if (data.exportUrl) return false;
        if (data.status === 'REJECTED' || data.status === 'COMPLETED') return false;
        return 3_000;
      },
    })),
  });
}


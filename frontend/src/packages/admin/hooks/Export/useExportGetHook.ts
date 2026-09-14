'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { ExportGetService } from '@/packages/admin/services/Export/ExportGetService';

export function useExportGetHook(exportId: string | null) {
  return useQuery({
    queryKey: adminQueryKeys.export(exportId ?? ''),
    queryFn: () => ExportGetService(exportId!),
    enabled: Boolean(exportId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'PENDING' || status === 'RUNNING' ? 2_000 : false;
    },
  });
}

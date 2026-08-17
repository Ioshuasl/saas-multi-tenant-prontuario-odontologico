'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { TenantExportGetService } from '@/packages/admin/services/TenantExport/TenantExportGetService';

export function useTenantExportGetHook(exportId: string | null) {
  return useQuery({
    queryKey: adminQueryKeys.tenantExport(exportId ?? ''),
    queryFn: () => TenantExportGetService(exportId!),
    enabled: Boolean(exportId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'PENDING' || status === 'RUNNING' ? 2_000 : false;
    },
  });
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { ReportExportGetService } from '@/packages/admin/services/Report/ReportExportGetService';

export function useReportExportGetHook(exportId: string | null) {
  return useQuery({
    queryKey: adminQueryKeys.reportExport(exportId ?? ''),
    queryFn: () => ReportExportGetService(exportId!),
    enabled: Boolean(exportId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'READY' || status === 'FAILED') return false;
      return 2000;
    },
  });
}

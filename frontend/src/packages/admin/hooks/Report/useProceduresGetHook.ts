'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { ProceduresGetService } from '@/packages/admin/services/Report/ProceduresGetService';
import type { ProceduresQuery } from '@/packages/admin/types/Report/ReportTypes';

export function useProceduresGetHook(query: ProceduresQuery, enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.reportProcedures(query),
    queryFn: () => ProceduresGetService(query),
    enabled: enabled && Boolean(query.from && query.to),
  });
}

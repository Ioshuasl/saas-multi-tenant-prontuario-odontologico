'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { ProcedureGetService } from '@/packages/admin/services/Report/ProcedureGetService';
import type { ReportPeriodQuery } from '@/packages/admin/types/Report/ReportTypes';

export function useProcedureGetHook(query: ReportPeriodQuery, enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.procedureReport(query),
    queryFn: () => ProcedureGetService(query),
    enabled,
  });
}

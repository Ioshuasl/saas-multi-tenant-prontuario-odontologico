'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { DashboardAppointmentListService } from '@/packages/admin/services/Dashboard/DashboardAppointmentListService';
import type { DashboardAppointmentListQuery } from '@/packages/admin/types/Dashboard/DashboardAppointmentTypes';

export function useDashboardAppointmentListHook(
  query: DashboardAppointmentListQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: adminQueryKeys.dashboardAppointments(query),
    queryFn: () => DashboardAppointmentListService(query),
    enabled: enabled && Boolean(query.from && query.to),
  });
}

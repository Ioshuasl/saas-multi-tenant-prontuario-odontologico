import { apiClient } from '@/shared/api/api-client';
import type { DashboardDto, DashboardQuery } from '@/packages/admin/types/Dashboard/DashboardTypes';

export async function DashboardGetData(query: DashboardQuery = {}): Promise<DashboardDto> {
  const params = new URLSearchParams();
  if (query.date) params.set('date', query.date);
  if (query.unitId) params.set('unitId', query.unitId);
  const qs = params.toString();
  return apiClient.request<DashboardDto>(`/reports/dashboard${qs ? `?${qs}` : ''}`);
}

import { apiClient } from '@/shared/api/api-client';
import type { DashboardQuery, DashboardReport } from '@/packages/admin/types/Report/ReportTypes';

export async function DashboardGetData(query: DashboardQuery = {}): Promise<DashboardReport> {
  const params = new URLSearchParams();
  if (query.date) params.set('date', query.date);
  if (query.unitId) params.set('unitId', query.unitId);
  const qs = params.toString();
  return apiClient.request<DashboardReport>(`/reports/dashboard${qs ? `?${qs}` : ''}`);
}

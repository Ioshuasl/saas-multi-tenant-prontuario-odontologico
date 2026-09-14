import { apiClient } from '@/shared/api/api-client';
import type { RevenueQuery, RevenueReport } from '@/packages/admin/types/Report/ReportTypes';

export async function RevenueGetData(query: RevenueQuery): Promise<RevenueReport> {
  const params = new URLSearchParams();
  params.set('from', query.from);
  params.set('to', query.to);
  if (query.groupBy) params.set('groupBy', query.groupBy);
  if (query.unitId) params.set('unitId', query.unitId);
  return apiClient.request<RevenueReport>(`/reports/revenue?${params.toString()}`);
}

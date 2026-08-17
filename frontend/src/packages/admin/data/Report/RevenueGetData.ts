import { apiClient } from '@/shared/api/api-client';
import type { RevenueQuery, RevenueReport } from '@/packages/admin/types/Report/ReportTypes';

export async function RevenueGetData(query: RevenueQuery = {}): Promise<RevenueReport> {
  const params = new URLSearchParams();
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.groupBy) params.set('groupBy', query.groupBy);
  if (query.unitId) params.set('unitId', query.unitId);
  const qs = params.toString();
  return apiClient.request<RevenueReport>(`/reports/revenue${qs ? `?${qs}` : ''}`);
}

import { apiClient } from '@/shared/api/api-client';
import type { NoShowsQuery, NoShowsReport } from '@/packages/admin/types/Report/ReportTypes';

export async function NoShowsGetData(query: NoShowsQuery): Promise<NoShowsReport> {
  const params = new URLSearchParams();
  params.set('from', query.from);
  params.set('to', query.to);
  if (query.professionalId) params.set('professionalId', query.professionalId);
  if (query.unitId) params.set('unitId', query.unitId);
  return apiClient.request<NoShowsReport>(`/reports/no-shows?${params.toString()}`);
}

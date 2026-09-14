import { apiClient } from '@/shared/api/api-client';
import type { ProceduresQuery, ProceduresReport } from '@/packages/admin/types/Report/ReportTypes';

export async function ProceduresGetData(query: ProceduresQuery): Promise<ProceduresReport> {
  const params = new URLSearchParams();
  params.set('from', query.from);
  params.set('to', query.to);
  if (query.professionalId) params.set('professionalId', query.professionalId);
  if (query.unitId) params.set('unitId', query.unitId);
  return apiClient.request<ProceduresReport>(`/reports/procedures?${params.toString()}`);
}

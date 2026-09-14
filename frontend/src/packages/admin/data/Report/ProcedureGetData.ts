import { apiClient } from '@/shared/api/api-client';
import type { ProcedureReport, ReportPeriodQuery } from '@/packages/admin/types/Report/ReportTypes';

export async function ProcedureGetData(query: ReportPeriodQuery = {}): Promise<ProcedureReport> {
  const params = new URLSearchParams();
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.professionalId) params.set('professionalId', query.professionalId);
  if (query.unitId) params.set('unitId', query.unitId);
  const qs = params.toString();
  return apiClient.request<ProcedureReport>(`/reports/procedures${qs ? `?${qs}` : ''}`);
}

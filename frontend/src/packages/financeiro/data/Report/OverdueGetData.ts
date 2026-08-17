import { apiClient } from '@/shared/api/api-client';
import type { OverdueReport } from '@/packages/financeiro/types/Report/ReportTypes';

export async function OverdueGetData(unitId?: string): Promise<OverdueReport> {
  const params = new URLSearchParams();
  if (unitId) params.set('unitId', unitId);
  const qs = params.toString();
  return apiClient.request<OverdueReport>(`/reports/overdue${qs ? `?${qs}` : ''}`);
}

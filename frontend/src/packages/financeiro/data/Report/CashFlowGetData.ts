import { apiClient } from '@/shared/api/api-client';
import type { CashFlowQuery, CashFlowReport } from '@/packages/financeiro/types/Report/ReportTypes';

export async function CashFlowGetData(query: CashFlowQuery): Promise<CashFlowReport> {
  const params = new URLSearchParams();
  params.set('from', query.from);
  params.set('to', query.to);
  params.set('basis', query.basis);
  if (query.unitId) params.set('unitId', query.unitId);
  return apiClient.request<CashFlowReport>(`/reports/cash-flow?${params.toString()}`);
}

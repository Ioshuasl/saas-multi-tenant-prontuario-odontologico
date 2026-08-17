import { apiClient } from '@/shared/api/api-client';
import type {
  ProductionQuery,
  ProductionReport,
} from '@/packages/financeiro/types/Report/ReportTypes';

export async function ProductionGetData(query: ProductionQuery): Promise<ProductionReport> {
  const params = new URLSearchParams();
  params.set('from', query.from);
  params.set('to', query.to);
  if (query.professionalId) params.set('professionalId', query.professionalId);
  return apiClient.request<ProductionReport>(`/reports/production?${params.toString()}`);
}

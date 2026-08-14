import { apiClient } from '@/shared/api/api-client';
import type { QuoteProcedureOption } from '@/packages/operacional/types/Quote/QuoteTypes';

export async function QuoteProcedureListData(): Promise<QuoteProcedureOption[]> {
  const rows = await apiClient.request<QuoteProcedureOption[]>('/procedures');
  return rows.filter((procedure) => procedure.active !== false);
}

import { apiClient } from '@/shared/api/api-client';
import type { FinancialCategory } from '@/packages/financeiro/types/Payable/PayableTypes';

export async function FinancialCategoryListData(
  kind?: 'REVENUE' | 'EXPENSE',
): Promise<FinancialCategory[]> {
  const params = new URLSearchParams();
  if (kind) params.set('kind', kind);
  const qs = params.toString();
  return apiClient.request<FinancialCategory[]>(
    `/financial-categories${qs ? `?${qs}` : ''}`,
  );
}

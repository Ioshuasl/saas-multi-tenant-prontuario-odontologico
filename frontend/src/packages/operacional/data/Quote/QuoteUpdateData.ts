import { apiClient } from '@/shared/api/api-client';
import type { QuoteDetail, QuoteUpdateInput } from '@/packages/operacional/types/Quote/QuoteTypes';

export async function QuoteUpdateData(
  quoteId: string,
  quoteSchema: QuoteUpdateInput,
): Promise<QuoteDetail> {
  return apiClient.request<QuoteDetail>(`/quotes/${encodeURIComponent(quoteId)}`, {
    method: 'PATCH',
    body: JSON.stringify(quoteSchema),
  });
}

import { apiClient } from '@/shared/api/api-client';
import type { QuoteDetail, QuoteItemCreateInput } from '@/packages/operacional/types/Quote/QuoteTypes';

export async function QuoteItemCreateData(
  quoteId: string,
  quoteItemSchema: QuoteItemCreateInput,
): Promise<QuoteDetail> {
  return apiClient.request<QuoteDetail>(`/quotes/${encodeURIComponent(quoteId)}/items`, {
    method: 'POST',
    body: JSON.stringify(quoteItemSchema),
  });
}

import { apiClient } from '@/shared/api/api-client';
import type { QuoteCreateInput, QuoteDetail } from '@/packages/operacional/types/Quote/QuoteTypes';

export async function QuoteCreateData(quoteSchema: QuoteCreateInput): Promise<QuoteDetail> {
  return apiClient.request<QuoteDetail>('/quotes', {
    method: 'POST',
    body: JSON.stringify(quoteSchema),
  });
}

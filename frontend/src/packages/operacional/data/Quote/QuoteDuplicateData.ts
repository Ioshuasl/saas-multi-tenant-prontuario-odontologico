import { apiClient } from '@/shared/api/api-client';
import type { QuoteDetail } from '@/packages/operacional/types/Quote/QuoteTypes';

export async function QuoteDuplicateData(quoteId: string): Promise<QuoteDetail> {
  return apiClient.request<QuoteDetail>(`/quotes/${encodeURIComponent(quoteId)}/duplicate`, {
    method: 'POST',
  });
}

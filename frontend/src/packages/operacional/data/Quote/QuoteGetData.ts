import { apiClient } from '@/shared/api/api-client';
import type { QuoteDetail } from '@/packages/operacional/types/Quote/QuoteTypes';

export async function QuoteGetData(quoteId: string): Promise<QuoteDetail> {
  return apiClient.request<QuoteDetail>(`/quotes/${encodeURIComponent(quoteId)}`);
}

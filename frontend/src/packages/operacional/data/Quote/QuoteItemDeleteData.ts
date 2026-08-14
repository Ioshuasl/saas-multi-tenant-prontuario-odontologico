import { apiClient } from '@/shared/api/api-client';
import type { QuoteDetail } from '@/packages/operacional/types/Quote/QuoteTypes';

export async function QuoteItemDeleteData(quoteId: string, itemId: string): Promise<QuoteDetail> {
  return apiClient.request<QuoteDetail>(
    `/quotes/${encodeURIComponent(quoteId)}/items/${encodeURIComponent(itemId)}`,
    { method: 'DELETE' },
  );
}

import { apiClient } from '@/shared/api/api-client';
import type { PublicQuoteView } from '@/packages/public/types/Quote/QuoteTypes';

export async function QuoteGetData(token: string): Promise<PublicQuoteView> {
  return apiClient.request<PublicQuoteView>(`/public/quotes/${encodeURIComponent(token)}`, {
    skipAuth: true,
  });
}

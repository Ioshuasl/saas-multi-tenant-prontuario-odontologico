import { apiClient } from '@/shared/api/api-client';
import type { QuotePdfResult } from '@/packages/operacional/types/Quote/QuoteTypes';

export async function QuotePdfData(quoteId: string): Promise<QuotePdfResult> {
  return apiClient.request<QuotePdfResult>(`/quotes/${encodeURIComponent(quoteId)}/pdf`);
}

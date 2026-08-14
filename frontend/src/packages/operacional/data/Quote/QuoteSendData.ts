import { apiClient } from '@/shared/api/api-client';
import type { QuoteSendFormValues } from '@/packages/operacional/schemas/Quote/QuoteSendSchema';
import type { QuoteSendResult } from '@/packages/operacional/types/Quote/QuoteTypes';

export async function QuoteSendData(
  quoteId: string,
  quoteSendSchema: QuoteSendFormValues,
): Promise<QuoteSendResult> {
  return apiClient.request<QuoteSendResult>(`/quotes/${encodeURIComponent(quoteId)}/send`, {
    method: 'POST',
    body: JSON.stringify(quoteSendSchema),
  });
}

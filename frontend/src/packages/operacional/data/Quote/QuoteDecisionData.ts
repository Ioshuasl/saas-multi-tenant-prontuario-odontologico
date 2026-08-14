import { apiClient } from '@/shared/api/api-client';
import type { QuoteDecisionInput, QuoteDecisionResult } from '@/packages/operacional/types/Quote/QuoteTypes';

export async function QuoteDecisionData(
  quoteId: string,
  quoteDecisionSchema: QuoteDecisionInput,
  idempotencyKey: string,
): Promise<QuoteDecisionResult> {
  return apiClient.request<QuoteDecisionResult>(
    `/quotes/${encodeURIComponent(quoteId)}/decision`,
    {
      method: 'POST',
      body: JSON.stringify(quoteDecisionSchema),
      headers: { 'Idempotency-Key': idempotencyKey },
    },
  );
}

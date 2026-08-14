import { apiClient } from '@/shared/api/api-client';
import type {
  PublicQuoteDecisionInput,
  PublicQuoteDecisionResult,
} from '@/packages/public/types/Quote/QuoteTypes';

export async function QuoteDecisionCreateData(
  token: string,
  quoteDecisionSchema: PublicQuoteDecisionInput,
  idempotencyKey: string,
): Promise<PublicQuoteDecisionResult> {
  return apiClient.request<PublicQuoteDecisionResult>(
    `/public/quotes/${encodeURIComponent(token)}/decision`,
    {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(quoteDecisionSchema),
      headers: { 'Idempotency-Key': idempotencyKey },
    },
  );
}

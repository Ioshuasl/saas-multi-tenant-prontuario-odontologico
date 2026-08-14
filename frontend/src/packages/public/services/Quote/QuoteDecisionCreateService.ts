import { QuoteDecisionCreateData } from '@/packages/public/data/Quote/QuoteDecisionCreateData';
import type { PublicQuoteDecisionInput } from '@/packages/public/types/Quote/QuoteTypes';

export async function QuoteDecisionCreateService(input: {
  token: string;
  quoteDecisionSchema: PublicQuoteDecisionInput;
  idempotencyKey: string;
}) {
  return QuoteDecisionCreateData(input.token, input.quoteDecisionSchema, input.idempotencyKey);
}

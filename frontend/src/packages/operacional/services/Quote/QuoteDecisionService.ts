import { QuoteDecisionData } from '@/packages/operacional/data/Quote/QuoteDecisionData';
import type { QuoteDecisionInput } from '@/packages/operacional/types/Quote/QuoteTypes';

export async function QuoteDecisionService(input: {
  quoteId: string;
  quoteDecisionSchema: QuoteDecisionInput;
  idempotencyKey: string;
}) {
  return QuoteDecisionData(input.quoteId, input.quoteDecisionSchema, input.idempotencyKey);
}

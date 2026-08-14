import { QuoteItemCreateData } from '@/packages/operacional/data/Quote/QuoteItemCreateData';
import type { QuoteItemCreateInput } from '@/packages/operacional/types/Quote/QuoteTypes';

export async function QuoteItemCreateService(quoteId: string, quoteItemSchema: QuoteItemCreateInput) {
  return QuoteItemCreateData(quoteId, quoteItemSchema);
}

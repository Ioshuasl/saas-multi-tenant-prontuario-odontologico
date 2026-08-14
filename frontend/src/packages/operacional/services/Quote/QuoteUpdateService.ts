import { QuoteUpdateData } from '@/packages/operacional/data/Quote/QuoteUpdateData';
import type { QuoteUpdateInput } from '@/packages/operacional/types/Quote/QuoteTypes';

export async function QuoteUpdateService(quoteId: string, quoteSchema: QuoteUpdateInput) {
  return QuoteUpdateData(quoteId, quoteSchema);
}

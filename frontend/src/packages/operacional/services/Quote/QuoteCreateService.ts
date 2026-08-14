import { QuoteCreateData } from '@/packages/operacional/data/Quote/QuoteCreateData';
import type { QuoteCreateInput } from '@/packages/operacional/types/Quote/QuoteTypes';

export async function QuoteCreateService(quoteSchema: QuoteCreateInput) {
  return QuoteCreateData(quoteSchema);
}

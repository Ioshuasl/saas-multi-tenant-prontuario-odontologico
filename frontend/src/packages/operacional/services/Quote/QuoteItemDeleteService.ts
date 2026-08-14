import { QuoteItemDeleteData } from '@/packages/operacional/data/Quote/QuoteItemDeleteData';

export async function QuoteItemDeleteService(quoteId: string, itemId: string) {
  return QuoteItemDeleteData(quoteId, itemId);
}

import { QuoteGetData } from '@/packages/operacional/data/Quote/QuoteGetData';

export async function QuoteGetService(quoteId: string) {
  return QuoteGetData(quoteId);
}

import { QuoteGetData } from '@/packages/public/data/Quote/QuoteGetData';

export async function QuoteGetService(token: string) {
  return QuoteGetData(token);
}

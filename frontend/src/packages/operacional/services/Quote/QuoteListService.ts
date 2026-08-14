import { QuoteListData } from '@/packages/operacional/data/Quote/QuoteListData';
import type { QuoteListQuery } from '@/packages/operacional/types/Quote/QuoteTypes';

export async function QuoteListService(query: QuoteListQuery = {}) {
  return QuoteListData(query);
}

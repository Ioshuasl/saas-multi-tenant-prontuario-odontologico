import { QuoteDuplicateData } from '@/packages/operacional/data/Quote/QuoteDuplicateData';

export async function QuoteDuplicateService(quoteId: string) {
  return QuoteDuplicateData(quoteId);
}

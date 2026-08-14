import { QuotePdfData } from '@/packages/operacional/data/Quote/QuotePdfData';

export async function QuotePdfService(quoteId: string) {
  return QuotePdfData(quoteId);
}

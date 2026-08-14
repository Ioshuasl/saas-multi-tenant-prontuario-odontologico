import { QuoteSendData } from '@/packages/operacional/data/Quote/QuoteSendData';
import type { QuoteSendFormValues } from '@/packages/operacional/schemas/Quote/QuoteSendSchema';

export async function QuoteSendService(input: {
  quoteId: string;
  quoteSendSchema: QuoteSendFormValues;
}) {
  return QuoteSendData(input.quoteId, input.quoteSendSchema);
}

import type { QuoteStatus } from '../../../enum/quote/quote_status.enum.js';
import type { QuoteTimelineItem } from '../../../types/quote/quote_timeline.types.js';

type QuoteRow = {
  id: string;
  number: bigint;
  status: string;
  totalCents: bigint;
  decidedAt: Date | null;
  createdAt: Date;
};

export function toQuoteTimelineItem(row: QuoteRow): QuoteTimelineItem {
  return {
    id: row.id,
    number: row.number.toString(),
    status: row.status as QuoteStatus,
    totalCents: Number(row.totalCents),
    decidedAt: row.decidedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

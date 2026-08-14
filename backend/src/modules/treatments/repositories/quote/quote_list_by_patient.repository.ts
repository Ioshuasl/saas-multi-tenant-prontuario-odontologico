import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { QuoteTimelineItem } from '../../types/quote/quote_timeline.types.js';
import { toQuoteTimelineItem } from './mappers/quote.mapper.js';

export class ListByPatientRepository {
  async execute(ctx: RequestContext, patientId: string): Promise<QuoteTimelineItem[]> {
    const rows = await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.quote.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          number: true,
          status: true,
          totalCents: true,
          decidedAt: true,
          createdAt: true,
        },
      }),
    );
    return rows.map(toQuoteTimelineItem);
  }
}

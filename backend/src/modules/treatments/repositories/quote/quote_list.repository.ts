import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { QuoteListQuerySchema } from '../../schemas/quote.schema.js';
import type { QuoteListResult } from '../../types/quote/quote_crud.types.js';
import { toQuoteListItemDto } from './mappers/quote_crud.mapper.js';

export class ListRepository {
  async execute(ctx: RequestContext, query: QuoteListQuerySchema): Promise<QuoteListResult> {
    const limit = query.limit ?? 20;
    const from = query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined;
    const to = query.to ? new Date(`${query.to}T23:59:59.999Z`) : undefined;

    const rows = await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.quote.findMany({
        where: {
          ...(query.patientId ? { patientId: query.patientId } : {}),
          ...(query.status ? { status: query.status } : {}),
          ...(from || to
            ? {
                createdAt: {
                  ...(from ? { gte: from } : {}),
                  ...(to ? { lte: to } : {}),
                },
              }
            : {}),
          ...(query.cursor ? { id: { lt: query.cursor } } : {}),
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
      }),
    );

    const page = rows.slice(0, limit);
    const next = rows.length > limit ? page[page.length - 1]?.id ?? null : null;
    return {
      items: page.map(toQuoteListItemDto),
      nextCursor: next,
    };
  }
}

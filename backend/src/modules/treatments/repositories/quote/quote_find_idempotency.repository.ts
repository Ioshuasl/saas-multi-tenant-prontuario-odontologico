import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { QuoteDto } from '../../types/quote/quote_crud.types.js';
import { toQuoteDto } from './mappers/quote_crud.mapper.js';

const quoteGetInclude = {
  items: {
    include: { procedure: { select: { name: true, code: true } } },
    orderBy: { sortOrder: 'asc' as const },
  },
  receivables: {
    include: { lines: { orderBy: { number: 'asc' as const } } },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
} as const;

export class FindByIdempotencyRepository {
  async execute(ctx: RequestContext, idempotencyKey: string): Promise<QuoteDto | null> {
    const row = await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.quote.findFirst({
        where: { idempotencyKey },
        include: quoteGetInclude,
      }),
    );
    return row ? toQuoteDto(row) : null;
  }
}

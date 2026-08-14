import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { QuoteDto } from '../../types/quote/quote_crud.types.js';
import { toQuoteDto } from './mappers/quote_crud.mapper.js';

const itemInclude = { procedure: { select: { name: true, code: true } } } as const;

export class UpdateTotalsRepository {
  async execute(
    ctx: RequestContext,
    quoteId: string,
    quoteSchema: {
      subtotalCents: bigint;
      discountCents: bigint;
      totalCents: bigint;
      validUntil?: Date | null;
      notes?: string | null;
    },
  ): Promise<QuoteDto> {
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      await tx.quote.update({
        where: { id: quoteId },
        data: {
          subtotalCents: quoteSchema.subtotalCents,
          discountCents: quoteSchema.discountCents,
          totalCents: quoteSchema.totalCents,
          ...(quoteSchema.validUntil !== undefined ? { validUntil: quoteSchema.validUntil } : {}),
          ...(quoteSchema.notes !== undefined ? { notes: quoteSchema.notes } : {}),
        },
      });
      const row = await tx.quote.findFirstOrThrow({
        where: { id: quoteId },
        include: { items: { include: itemInclude, orderBy: { sortOrder: 'asc' } } },
      });
      return toQuoteDto(row);
    });
  }
}

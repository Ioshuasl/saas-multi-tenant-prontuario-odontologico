import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { QuoteDto } from '../../types/quote/quote_crud.types.js';
import { toQuoteDto } from './mappers/quote_crud.mapper.js';

const itemInclude = { procedure: { select: { name: true, code: true } } } as const;

export class DeleteItemRepository {
  async execute(
    ctx: RequestContext,
    quoteId: string,
    itemId: string,
    totals: { subtotalCents: bigint; discountCents: bigint; totalCents: bigint },
  ): Promise<QuoteDto> {
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      await tx.quoteItem.delete({ where: { id: itemId } });
      await tx.quote.update({
        where: { id: quoteId },
        data: {
          subtotalCents: totals.subtotalCents,
          discountCents: totals.discountCents,
          totalCents: totals.totalCents,
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

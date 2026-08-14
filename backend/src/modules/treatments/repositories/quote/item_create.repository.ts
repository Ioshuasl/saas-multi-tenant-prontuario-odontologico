import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { PricedQuoteLine } from '../../models/quote.model.js';
import type { QuoteDto } from '../../types/quote/quote_crud.types.js';
import { toQuoteDto } from './mappers/quote_crud.mapper.js';

const itemInclude = { procedure: { select: { name: true, code: true } } } as const;

export class CreateItemRepository {
  async execute(
    ctx: RequestContext,
    quoteId: string,
    line: PricedQuoteLine,
    totals: { subtotalCents: bigint; discountCents: bigint; totalCents: bigint },
    sortOrder: number,
  ): Promise<QuoteDto> {
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      await tx.quoteItem.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          quoteId,
          procedureId: line.procedureId,
          toothCode: line.toothCode ?? null,
          face: line.face ?? null,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          discountCents: BigInt(line.discountCents),
          totalCents: line.totalCents,
          sortOrder,
          approved: true,
        },
      });
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

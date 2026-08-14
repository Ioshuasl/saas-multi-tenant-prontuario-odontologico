import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { QuoteDto } from '../../types/quote/quote_crud.types.js';
import { toQuoteDto } from './mappers/quote_crud.mapper.js';

const itemInclude = { procedure: { select: { name: true, code: true } } } as const;

export class MarkSentRepository {
  async executeInTx(tx: DbTransaction, quoteId: string): Promise<QuoteDto> {
    await tx.quote.update({
      where: { id: quoteId },
      data: { status: 'SENT', sentAt: new Date() },
    });
    const row = await tx.quote.findFirstOrThrow({
      where: { id: quoteId },
      include: { items: { include: itemInclude, orderBy: { sortOrder: 'asc' } } },
    });
    return toQuoteDto(row);
  }
}

export class SetPdfKeyRepository {
  async execute(ctx: RequestContext, quoteId: string, pdfStorageKey: string): Promise<void> {
    await getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      await tx.quote.update({
        where: { id: quoteId },
        data: { pdfStorageKey },
      });
    });
  }
}

export class GetPdfKeyRepository {
  async execute(
    ctx: RequestContext,
    quoteId: string,
  ): Promise<{ pdfStorageKey: string | null } | null> {
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      const row = await tx.quote.findFirst({
        where: { id: quoteId },
        select: { pdfStorageKey: true },
      });
      return row;
    });
  }
}

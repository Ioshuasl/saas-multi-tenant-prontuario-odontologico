import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import type { QuoteDto } from '../../types/quote/quote_crud.types.js';
import type { PricedQuoteLine } from '../../models/quote.model.js';
import { toQuoteDto } from './mappers/quote_crud.mapper.js';

const itemInclude = { procedure: { select: { name: true, code: true } } } as const;

export type CreateQuotePersist = {
  id: string;
  unitId: string;
  patientId: string;
  professionalId: string;
  number: bigint;
  subtotalCents: bigint;
  discountCents: bigint;
  totalCents: bigint;
  validUntil: Date | null;
  notes: string | null;
  duplicatedFromId?: string | null;
  items: Array<PricedQuoteLine & { id: string }>;
};

export class CreateRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    quoteSchema: CreateQuotePersist,
  ): Promise<QuoteDto> {
    await tx.quote.create({
      data: {
        id: quoteSchema.id,
        tenantId: ctx.tenantId,
        unitId: quoteSchema.unitId,
        patientId: quoteSchema.patientId,
        professionalId: quoteSchema.professionalId,
        number: quoteSchema.number,
        status: 'DRAFT',
        subtotalCents: quoteSchema.subtotalCents,
        discountCents: quoteSchema.discountCents,
        totalCents: quoteSchema.totalCents,
        validUntil: quoteSchema.validUntil,
        notes: quoteSchema.notes,
        duplicatedFromId: quoteSchema.duplicatedFromId ?? null,
        items: {
          create: quoteSchema.items.map((item, index) => ({
            id: item.id,
            tenantId: ctx.tenantId,
            procedureId: item.procedureId,
            toothCode: item.toothCode ?? null,
            face: item.face ?? null,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            discountCents: BigInt(item.discountCents),
            totalCents: item.totalCents,
            sortOrder: index,
            approved: true,
          })),
        },
      },
    });

    const row = await tx.quote.findFirstOrThrow({
      where: { id: quoteSchema.id },
      include: { items: { include: itemInclude, orderBy: { sortOrder: 'asc' } } },
    });
    return toQuoteDto(row);
  }
}

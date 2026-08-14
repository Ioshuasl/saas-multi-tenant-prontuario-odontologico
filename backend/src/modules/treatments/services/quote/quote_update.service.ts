import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getProcedureById } from '../../../clinic/clinic_public.js';
import { priceQuoteLines, type ProcedurePricing } from '../../models/quote.model.js';
import { QuoteNotDraftError, QuoteNotFoundError } from '../../models/errors/treatments.errors.js';
import { GetRepository } from '../../repositories/quote/quote_get.repository.js';
import { UpdateTotalsRepository } from '../../repositories/quote/quote_update.repository.js';
import type { QuoteUpdateSchema } from '../../schemas/quote.schema.js';
import type { QuoteDto } from '../../types/quote/quote_crud.types.js';

export class UpdateService {
  constructor(
    private readonly get = new GetRepository(),
    private readonly update = new UpdateTotalsRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    quoteId: string,
    quoteSchema: QuoteUpdateSchema,
  ): Promise<QuoteDto> {
    const existing = await this.get.execute(ctx, quoteId);
    if (!existing) throw new QuoteNotFoundError();
    if (existing.status !== 'DRAFT') throw new QuoteNotDraftError(existing.status);

    const procedures = new Map<string, ProcedurePricing>();
    for (const item of existing.items) {
      const procedure = await getProcedureById(ctx, item.procedureId);
      procedures.set(item.procedureId, {
        id: item.procedureId,
        priceCents: item.unitPriceCents,
        requiresTooth: Boolean(item.toothCode) || (procedure?.requiresTooth ?? false),
        requiresFace: Boolean(item.face) || (procedure?.requiresFace ?? false),
        active: true,
      });
    }

    const money = priceQuoteLines(
      existing.items.map((item) => ({
        procedureId: item.procedureId,
        toothCode: item.toothCode,
        face: item.face as 'M' | 'D' | 'V' | 'L' | 'O' | 'C' | null,
        quantity: item.quantity,
        discountCents: item.discountCents,
        unitPriceCents: item.unitPriceCents,
      })),
      procedures,
      quoteSchema.discountCents ?? existing.discountCents,
      ctx.role,
    );

    const validUntil =
      quoteSchema.validUntil === undefined
        ? undefined
        : quoteSchema.validUntil === null
          ? null
          : new Date(`${quoteSchema.validUntil}T00:00:00.000Z`);

    return this.update.execute(ctx, quoteId, {
      subtotalCents: money.subtotalCents,
      discountCents: money.discountCents,
      totalCents: money.totalCents,
      validUntil,
      notes: quoteSchema.notes,
    });
  }
}

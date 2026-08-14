import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getProcedureById } from '../../../clinic/clinic_public.js';
import { priceQuoteLines, type ProcedurePricing } from '../../models/quote.model.js';
import {
  ProcedureInactiveError,
  ProcedureNotFoundError,
  QuoteNotDraftError,
  QuoteNotFoundError,
} from '../../models/errors/treatments.errors.js';
import { CreateItemRepository } from '../../repositories/quote/item_create.repository.js';
import { GetRepository } from '../../repositories/quote/quote_get.repository.js';
import type { QuoteItemCreateSchema } from '../../schemas/quote.schema.js';
import type { QuoteDto } from '../../types/quote/quote_crud.types.js';

export class CreateService {
  constructor(
    private readonly get = new GetRepository(),
    private readonly createItem = new CreateItemRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    quoteId: string,
    itemSchema: QuoteItemCreateSchema,
  ): Promise<QuoteDto> {
    const existing = await this.get.execute(ctx, quoteId);
    if (!existing) throw new QuoteNotFoundError();
    if (existing.status !== 'DRAFT') throw new QuoteNotDraftError(existing.status);

    const procedure = await getProcedureById(ctx, itemSchema.procedureId);
    if (!procedure) throw new ProcedureNotFoundError();
    if (!procedure.active) throw new ProcedureInactiveError();

    const procedures = new Map<string, ProcedurePricing>();
    for (const item of existing.items) {
      procedures.set(item.procedureId, {
        id: item.procedureId,
        priceCents: item.unitPriceCents,
        requiresTooth: Boolean(item.toothCode),
        requiresFace: Boolean(item.face),
        active: true,
      });
    }
    procedures.set(procedure.id, procedure);

    const lines = [
      ...existing.items.map((item) => ({
        procedureId: item.procedureId,
        toothCode: item.toothCode,
        face: item.face as 'M' | 'D' | 'V' | 'L' | 'O' | 'C' | null,
        quantity: item.quantity,
        discountCents: item.discountCents,
        unitPriceCents: item.unitPriceCents,
      })),
      {
        procedureId: itemSchema.procedureId,
        toothCode: itemSchema.toothCode,
        face: itemSchema.face,
        quantity: itemSchema.quantity ?? 1,
        discountCents: itemSchema.discountCents ?? 0,
      },
    ];

    const money = priceQuoteLines(lines, procedures, existing.discountCents, ctx.role);
    const added = money.lines[money.lines.length - 1]!;
    const sortOrder = existing.items.length;

    return this.createItem.execute(ctx, quoteId, added, money, sortOrder);
  }
}

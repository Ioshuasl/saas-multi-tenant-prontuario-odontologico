import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { priceQuoteLines, type ProcedurePricing } from '../../models/quote.model.js';
import {
  InvalidQuoteMoneyError,
  QuoteItemNotFoundError,
  QuoteNotDraftError,
  QuoteNotFoundError,
} from '../../models/errors/treatments.errors.js';
import { DeleteItemRepository } from '../../repositories/quote/item_delete.repository.js';
import { GetRepository } from '../../repositories/quote/quote_get.repository.js';
import type { QuoteDto } from '../../types/quote/quote_crud.types.js';

export class DeleteService {
  constructor(
    private readonly get = new GetRepository(),
    private readonly deleteItem = new DeleteItemRepository(),
  ) {}

  async execute(ctx: RequestContext, quoteId: string, itemId: string): Promise<QuoteDto> {
    const existing = await this.get.execute(ctx, quoteId);
    if (!existing) throw new QuoteNotFoundError();
    if (existing.status !== 'DRAFT') throw new QuoteNotDraftError(existing.status);

    const remaining = existing.items.filter((item) => item.id !== itemId);
    if (remaining.length === existing.items.length) throw new QuoteItemNotFoundError();
    if (remaining.length === 0) {
      throw new InvalidQuoteMoneyError('Orçamento precisa de ao menos um item.');
    }

    const procedures = new Map<string, ProcedurePricing>();
    for (const item of remaining) {
      procedures.set(item.procedureId, {
        id: item.procedureId,
        priceCents: item.unitPriceCents,
        requiresTooth: Boolean(item.toothCode),
        requiresFace: Boolean(item.face),
        active: true,
      });
    }

    const money = priceQuoteLines(
      remaining.map((item) => ({
        procedureId: item.procedureId,
        toothCode: item.toothCode,
        face: item.face as 'M' | 'D' | 'V' | 'L' | 'O' | 'C' | null,
        quantity: item.quantity,
        discountCents: item.discountCents,
        unitPriceCents: item.unitPriceCents,
      })),
      procedures,
      existing.discountCents,
      ctx.role,
    );

    return this.deleteItem.execute(ctx, quoteId, itemId, money);
  }
}

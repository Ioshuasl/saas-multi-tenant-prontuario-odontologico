import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { getProcedureById } from '../../../clinic/clinic_public.js';
import { CreateAction } from '../../actions/quote/quote_create.action.js';
import { priceQuoteLines, type ProcedurePricing } from '../../models/quote.model.js';
import {
  ProcedureInactiveError,
  ProcedureNotFoundError,
  QuoteCannotDuplicateError,
  QuoteNotFoundError,
} from '../../models/errors/treatments.errors.js';
import { GetRepository } from '../../repositories/quote/quote_get.repository.js';
import type { QuoteDto } from '../../types/quote/quote_crud.types.js';

const DUPLICABLE = new Set(['SENT', 'EXPIRED', 'REJECTED', 'PARTIALLY_APPROVED']);

export class DuplicateService {
  constructor(
    private readonly get = new GetRepository(),
    private readonly create = new CreateAction(),
  ) {}

  async execute(ctx: RequestContext, quoteId: string): Promise<QuoteDto> {
    const source = await this.get.execute(ctx, quoteId);
    if (!source) throw new QuoteNotFoundError();
    if (!DUPLICABLE.has(source.status)) throw new QuoteCannotDuplicateError(source.status);

    const procedures = new Map<string, ProcedurePricing>();
    for (const item of source.items) {
      const procedure = await getProcedureById(ctx, item.procedureId);
      if (!procedure) throw new ProcedureNotFoundError();
      if (!procedure.active) throw new ProcedureInactiveError();
      procedures.set(procedure.id, procedure);
    }

    const money = priceQuoteLines(
      source.items.map((item) => ({
        procedureId: item.procedureId,
        toothCode: item.toothCode,
        face: item.face,
        quantity: item.quantity,
        discountCents: item.discountCents,
      })),
      procedures,
      source.discountCents,
      ctx.role,
    );

    return this.create.execute(ctx, {
      unitId: source.unitId,
      patientId: source.patientId,
      professionalId: source.professionalId,
      subtotalCents: money.subtotalCents,
      discountCents: money.discountCents,
      totalCents: money.totalCents,
      validUntil: source.validUntil ? new Date(`${source.validUntil}T00:00:00.000Z`) : null,
      notes: source.notes,
      duplicatedFromId: source.id,
      items: money.lines.map((line) => ({ ...line, id: idGenerator.next() })),
    });
  }
}

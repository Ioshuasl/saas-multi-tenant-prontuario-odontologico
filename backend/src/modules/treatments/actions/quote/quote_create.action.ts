import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import {
  CreateRepository,
  type CreateQuotePersist,
} from '../../repositories/quote/quote_create.repository.js';
import { NextNumberRepository } from '../../repositories/quote/quote_next_number.repository.js';
import type { QuoteDto } from '../../types/quote/quote_crud.types.js';

export class CreateAction {
  constructor(
    private readonly nextNumber = new NextNumberRepository(),
    private readonly create = new CreateRepository(),
    private readonly uow = new UnitOfWork(),
  ) {}

  async execute(
    ctx: RequestContext,
    quoteSchema: Omit<CreateQuotePersist, 'id' | 'number'>,
  ): Promise<QuoteDto> {
    return this.uow.run(ctx, async ({ tx, publish }) => {
      const number = await this.nextNumber.executeInTx(tx, ctx);
      const id = idGenerator.next();
      const items = quoteSchema.items.map((item) => ({
        ...item,
        id: item.id || idGenerator.next(),
      }));
      const quote = await this.create.executeInTx(tx, ctx, {
        ...quoteSchema,
        id,
        number,
        items,
      });
      publish([
        {
          name: 'treatments.quote_created',
          payload: { quoteId: quote.id, patientId: quote.patientId, requestId: ctx.requestId },
        },
      ]);
      return quote;
    });
  }
}

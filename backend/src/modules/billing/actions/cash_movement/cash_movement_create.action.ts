import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import {
  CashSessionNotFoundError,
  RecordImmutableError,
} from '../../models/errors/billing.errors.js';
import { CreateRepository } from '../../repositories/cash_movement/cash_movement_create.repository.js';
import { GetRepository } from '../../repositories/cash_session/cash_session_get.repository.js';
import type { CashMovementCreateSchema } from '../../schemas/billing.schema.js';
import type { CashSessionDto } from '../../types/cash_session/cash_session.types.js';

export class CreateAction {
  constructor(
    private readonly get = new GetRepository(),
    private readonly create = new CreateRepository(),
    private readonly uow = new UnitOfWork(),
  ) {}

  async execute(
    ctx: RequestContext,
    sessionId: string,
    cashMovementSchema: CashMovementCreateSchema,
  ): Promise<CashSessionDto> {
    return this.uow.run(ctx, async ({ tx }) => {
      const session = await this.get.executeInTx(tx, sessionId);
      if (!session) throw new CashSessionNotFoundError();
      if (session.status === 'CLOSED') {
        throw new RecordImmutableError('Não é possível lançar movimento em caixa fechado.');
      }

      await this.create.executeInTx(tx, ctx, {
        cashSessionId: sessionId,
        kind: cashMovementSchema.kind,
        amountCents: BigInt(cashMovementSchema.amountCents),
        method: cashMovementSchema.method,
        description: cashMovementSchema.reason,
      });

      const updated = await this.get.executeInTx(tx, sessionId);
      if (!updated) throw new CashSessionNotFoundError();
      return updated;
    });
  }
}

import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import {
  ReceivableHasPaymentsError,
  ReceivableNotCancellableError,
  ReceivableNotFoundError,
} from '../../models/errors/billing.errors.js';
import {
  CancelRepository,
  CountActivePaymentsRepository,
} from '../../repositories/receivable/receivable_cancel.repository.js';
import { GetRepository } from '../../repositories/receivable/receivable_get.repository.js';
import type { ReceivableCancelSchema } from '../../schemas/billing.schema.js';

export class CancelAction {
  constructor(
    private readonly get = new GetRepository(),
    private readonly countPayments = new CountActivePaymentsRepository(),
    private readonly cancel = new CancelRepository(),
    private readonly uow = new UnitOfWork(),
  ) {}

  async execute(
    ctx: RequestContext,
    receivableId: string,
    receivableCancelSchema: ReceivableCancelSchema,
  ): Promise<{ id: string; status: 'CANCELLED' }> {
    const receivable = await this.get.execute(ctx, receivableId);
    if (!receivable) throw new ReceivableNotFoundError();
    if (receivable.status === 'CANCELLED') {
      throw new ReceivableNotCancellableError();
    }

    return this.uow.run(ctx, async ({ tx, publish }) => {
      const active = await this.countPayments.executeInTx(tx, receivableId);
      if (active > 0) throw new ReceivableHasPaymentsError();

      await this.cancel.executeInTx(tx, ctx, receivableId);
      publish([
        {
          name: 'billing.receivable_cancelled',
          payload: {
            receivableId,
            reason: receivableCancelSchema.reason,
            requestId: ctx.requestId,
          },
        },
      ]);
      return { id: receivableId, status: 'CANCELLED' as const };
    });
  }
}

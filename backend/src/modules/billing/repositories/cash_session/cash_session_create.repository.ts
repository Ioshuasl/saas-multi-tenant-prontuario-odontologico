import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { PaymentMethod } from '../../enum/payment/payment_method.enum.js';

export class CreateRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    persist: {
      unitId: string;
      openingCents: bigint;
      openingByMethod: Array<{ method: PaymentMethod; amountCents: number }>;
      idempotencyKey: string;
    },
  ): Promise<string> {
    const id = idGenerator.next();
    await tx.cashSession.create({
      data: {
        id,
        tenantId: ctx.tenantId,
        unitId: persist.unitId,
        openedBy: ctx.userId,
        openingCents: persist.openingCents,
        openingByMethod: persist.openingByMethod,
        status: 'OPEN',
        idempotencyKey: persist.idempotencyKey,
      },
    });
    return id;
  }
}

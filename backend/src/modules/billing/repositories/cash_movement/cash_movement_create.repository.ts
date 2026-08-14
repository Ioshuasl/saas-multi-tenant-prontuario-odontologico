import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { PaymentMethod } from '../../enum/payment/payment_method.enum.js';

export class CreateRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    persist: {
      cashSessionId: string;
      kind: 'SUPPLY' | 'WITHDRAWAL';
      amountCents: bigint;
      method: PaymentMethod;
      description: string;
    },
  ): Promise<string> {
    const id = idGenerator.next();
    await tx.cashMovement.create({
      data: {
        id,
        tenantId: ctx.tenantId,
        cashSessionId: persist.cashSessionId,
        kind: persist.kind,
        amountCents: persist.amountCents,
        method: persist.method,
        description: persist.description,
        createdBy: ctx.userId,
      },
    });
    return id;
  }
}

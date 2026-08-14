import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { civilDateUtc } from '../../helpers/civil_date.helper.js';
import type { PaymentMethod } from '../../enum/payment/payment_method.enum.js';
import type { PayableRecurrence } from '../../models/overdue.model.js';

export class PayRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    persist: {
      payableId: string;
      amountCents: bigint;
      description: string;
      method: PaymentMethod;
      paidAt: Date;
      payIdempotencyKey: string;
      cashSessionId: string | null;
      spawn: {
        unitId: string;
        categoryId: string | null;
        description: string;
        amountCents: bigint;
        dueDate: string;
        supplier: string | null;
        recurrence: PayableRecurrence | null;
      } | null;
    },
  ): Promise<string | null> {
    await tx.payable.update({
      where: { id: persist.payableId },
      data: {
        status: 'PAID',
        paidAt: persist.paidAt,
        paidCents: persist.amountCents,
        method: persist.method,
        payIdempotencyKey: persist.payIdempotencyKey,
      },
    });

    if (persist.cashSessionId) {
      await tx.cashMovement.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          cashSessionId: persist.cashSessionId,
          kind: 'PAYMENT_OUT',
          amountCents: persist.amountCents,
          method: persist.method,
          description: persist.description,
          createdBy: ctx.userId,
        },
      });
    }

    if (!persist.spawn) return null;
    const spawnedId = idGenerator.next();
    await tx.payable.create({
      data: {
        id: spawnedId,
        tenantId: ctx.tenantId,
        unitId: persist.spawn.unitId,
        categoryId: persist.spawn.categoryId,
        description: persist.spawn.description,
        amountCents: persist.spawn.amountCents,
        dueDate: civilDateUtc(persist.spawn.dueDate),
        supplier: persist.spawn.supplier,
        recurrence: persist.spawn.recurrence ?? undefined,
        status: 'OPEN',
      },
    });
    return spawnedId;
  }
}

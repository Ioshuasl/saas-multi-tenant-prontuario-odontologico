import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';

export class CancelRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    receivableId: string,
  ): Promise<void> {
    await tx.installment.updateMany({
      where: { tenantId: ctx.tenantId, receivableId },
      data: { status: 'CANCELLED' },
    });
    await tx.receivable.update({
      where: { id: receivableId },
      data: { status: 'CANCELLED' },
    });
  }
}

export class CountActivePaymentsRepository {
  async executeInTx(tx: DbTransaction, receivableId: string): Promise<number> {
    return tx.payment.count({
      where: {
        installment: { receivableId },
        reversedAt: null,
      },
    });
  }
}

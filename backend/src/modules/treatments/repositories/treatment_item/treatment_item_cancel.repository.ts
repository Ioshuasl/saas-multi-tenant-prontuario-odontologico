import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';

export class CancelRepository {
  async executeInTx(tx: DbTransaction, ctx: RequestContext, itemId: string): Promise<void> {
    await tx.treatmentItem.update({
      where: { id: itemId },
      data: { status: 'CANCELLED' },
    });
    void ctx;
  }
}

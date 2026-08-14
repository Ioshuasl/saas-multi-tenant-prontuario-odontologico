import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';

export class UpdateStatusRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    planId: string,
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED',
  ): Promise<void> {
    await tx.treatmentPlan.update({
      where: { id: planId },
      data: {
        status,
        completedAt: status === 'ACTIVE' ? null : new Date(),
      },
    });
    void ctx;
  }
}

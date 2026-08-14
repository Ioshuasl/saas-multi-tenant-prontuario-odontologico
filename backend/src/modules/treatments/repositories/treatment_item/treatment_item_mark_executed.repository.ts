import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';

export class MarkExecutedRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    itemId: string,
    input: { clinicalNoteId: string; professionalId: string },
  ): Promise<void> {
    await tx.treatmentItem.update({
      where: { id: itemId },
      data: {
        status: 'EXECUTED',
        executedAt: new Date(),
        clinicalNoteId: input.clinicalNoteId,
        professionalId: input.professionalId,
      },
    });
    void ctx;
  }
}

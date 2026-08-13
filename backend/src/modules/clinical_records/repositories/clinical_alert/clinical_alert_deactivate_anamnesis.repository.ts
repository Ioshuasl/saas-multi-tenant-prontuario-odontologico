import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';

export class DeactivateAnamnesisRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    medicalRecordId: string,
  ): Promise<void> {
    await tx.clinicalAlert.updateMany({
      where: {
        tenantId: ctx.tenantId,
        medicalRecordId,
        source: 'ANAMNESIS',
        active: true,
      },
      data: { active: false },
    });
  }
}

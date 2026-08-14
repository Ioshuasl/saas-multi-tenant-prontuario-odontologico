import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class SetOverdueRepository {
  async executeInTx(tx: DbTransaction, patientId: string, hasOverdue: boolean): Promise<void> {
    await tx.patient.update({
      where: { id: patientId },
      data: { hasOverdue },
    });
  }

  async execute(ctx: RequestContext, patientId: string, hasOverdue: boolean): Promise<void> {
    await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      this.executeInTx(tx, patientId, hasOverdue),
    );
  }
}

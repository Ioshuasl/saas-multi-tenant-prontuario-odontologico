import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';

export class GetIdRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    patientId: string,
  ): Promise<string | null> {
    const row = await tx.medicalRecord.findUnique({
      where: { tenantId_patientId: { tenantId: ctx.tenantId, patientId } },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async execute(ctx: RequestContext, patientId: string): Promise<string | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, (tx) => this.executeInTx(tx, ctx, patientId));
  }
}

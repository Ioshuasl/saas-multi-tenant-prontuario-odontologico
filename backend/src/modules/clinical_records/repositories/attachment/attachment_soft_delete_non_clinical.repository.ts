import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

const NON_CLINICAL = ['DOCUMENT', 'CONSENT_FORM', 'OTHER'] as const;

export class SoftDeleteNonClinicalRepository {
  async execute(ctx: RequestContext, patientId: string): Promise<number> {
    return getTenantPrisma().runInTenantContext(ctx, (tx) => this.executeInTx(tx, ctx, patientId));
  }

  async executeInTx(tx: DbTransaction, ctx: RequestContext, patientId: string): Promise<number> {
    const result = await tx.attachment.updateMany({
      where: {
        tenantId: ctx.tenantId,
        patientId,
        deletedAt: null,
        category: { in: [...NON_CLINICAL] },
      },
      data: {
        deletedAt: new Date(),
        deletedReason: 'DSR_DELETION',
        deletedBy: ctx.userId,
      },
    });
    return result.count;
  }
}

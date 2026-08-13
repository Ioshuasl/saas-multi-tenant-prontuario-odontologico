import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class GetIdRepository {
  async execute(ctx: RequestContext, patientId: string): Promise<string | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.medicalRecord.findUnique({
        where: { tenantId_patientId: { tenantId: ctx.tenantId, patientId } },
        select: { id: true },
      });
      return row?.id ?? null;
    });
  }
}

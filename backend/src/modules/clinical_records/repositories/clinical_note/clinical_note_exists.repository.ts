import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class ExistsRepository {
  async execute(ctx: RequestContext, medicalRecordId: string, noteId: string): Promise<boolean> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.clinicalNote.findFirst({
        where: { id: noteId, tenantId: ctx.tenantId, medicalRecordId },
        select: { id: true },
      });
      return Boolean(row);
    });
  }
}

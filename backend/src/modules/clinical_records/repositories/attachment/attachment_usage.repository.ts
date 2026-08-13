import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class UsageRepository {
  async execute(ctx: RequestContext): Promise<number> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const agg = await tx.attachment.aggregate({
        where: { tenantId: ctx.tenantId, deletedAt: null },
        _sum: { sizeBytes: true },
      });
      return Number(agg._sum.sizeBytes ?? 0);
    });
  }
}

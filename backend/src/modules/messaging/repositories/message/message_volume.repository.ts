import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class GetVolumeRepository {
  async execute(ctx: RequestContext): Promise<{ sent: number; failed: number }> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const [sent, failed] = await Promise.all([
        tx.message.count({
          where: { tenantId: ctx.tenantId, direction: 'OUTBOUND', status: { in: ['SENT', 'DELIVERED', 'READ'] } },
        }),
        tx.message.count({
          where: { tenantId: ctx.tenantId, direction: 'OUTBOUND', status: 'FAILED' },
        }),
      ]);
      return { sent, failed };
    });
  }
}

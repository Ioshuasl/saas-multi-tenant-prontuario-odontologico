import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { mapSubscription } from './mappers/subscription.mapper.js';
import type { SubscriptionSummary } from '../../types/subscription.types.js';

export class GetRepository {
  async execute(ctx: RequestContext): Promise<SubscriptionSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.subscription.findUnique({
        where: { tenantId: ctx.tenantId },
        include: { plan: true },
      });
      return row ? mapSubscription(row) : null;
    });
  }
}

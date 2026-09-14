import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { mapSubscription } from './mappers/subscription.mapper.js';
import type { SubscriptionSummary } from '../../types/subscription.types.js';

export class UpdateStatusRepository {
  async execute(
    ctx: RequestContext,
    status: string,
    extras?: { trialEndsAt?: Date | null; currentPeriodEnd?: Date | null },
  ): Promise<SubscriptionSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const existing = await tx.subscription.findUnique({
        where: { tenantId: ctx.tenantId },
      });
      if (!existing) return null;

      const row = await tx.subscription.update({
        where: { id: existing.id },
        data: {
          status,
          ...(extras?.trialEndsAt !== undefined ? { trialEndsAt: extras.trialEndsAt } : {}),
          ...(extras?.currentPeriodEnd !== undefined
            ? { currentPeriodEnd: extras.currentPeriodEnd }
            : {}),
        },
        include: { plan: true },
      });

      await tx.tenant.update({
        where: { id: ctx.tenantId },
        data: { status },
      });

      return mapSubscription(row);
    });
  }
}

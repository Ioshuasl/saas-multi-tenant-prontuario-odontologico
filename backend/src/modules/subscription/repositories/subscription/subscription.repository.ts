import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { SubscriptionSnapshot } from '../../types/subscription/subscription.types.js';
import { mapPlan } from '../plan/plan.repository.js';

const subscriptionInclude = {
  plan: true,
} as const;

function mapSnapshot(row: {
  id: string;
  tenantId: string;
  status: string;
  planId: string;
  currentPeriodEnd: Date | null;
  trialEndsAt: Date | null;
  plan: {
    id: string;
    code: string;
    name: string;
    priceCents: bigint;
    interval: string;
    limits: unknown;
    active: boolean;
  };
}): SubscriptionSnapshot {
  return {
    id: row.id,
    tenantId: row.tenantId,
    status: row.status,
    planId: row.planId,
    currentPeriodEnd: row.currentPeriodEnd,
    trialEndsAt: row.trialEndsAt,
    plan: mapPlan(row.plan),
  };
}

export class GetRepository {
  async execute(ctx: RequestContext): Promise<SubscriptionSnapshot | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.subscription.findFirst({
        where: { tenantId: ctx.tenantId },
        include: subscriptionInclude,
      });
      return row ? mapSnapshot(row) : null;
    });
  }
}

export class SeedRepository {
  async executeInTx(
    tx: DbTransaction,
    input: {
      tenantId: string;
      planId: string;
      status: string;
      trialEndsAt: Date;
      idNext: () => string;
    },
  ): Promise<void> {
    await tx.subscription.create({
      data: {
        id: input.idNext(),
        tenantId: input.tenantId,
        planId: input.planId,
        status: input.status,
        currentPeriodEnd: input.trialEndsAt,
        trialEndsAt: input.trialEndsAt,
      },
    });
  }
}

export class UpdateRepository {
  async execute(
    ctx: RequestContext,
    input: {
      status?: string;
      planId?: string;
      currentPeriodEnd?: Date | null;
      trialEndsAt?: Date | null;
    },
  ): Promise<SubscriptionSnapshot> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const existing = await tx.subscription.findFirst({
        where: { tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!existing) {
        throw new Error('subscription_missing');
      }
      const row = await tx.subscription.update({
        where: { id: existing.id },
        data: {
          status: input.status,
          planId: input.planId,
          currentPeriodEnd: input.currentPeriodEnd,
          trialEndsAt: input.trialEndsAt,
        },
        include: subscriptionInclude,
      });
      if (input.status) {
        await tx.tenant.update({
          where: { id: ctx.tenantId },
          data: { status: input.status },
        });
      }
      return mapSnapshot(row);
    });
  }
}

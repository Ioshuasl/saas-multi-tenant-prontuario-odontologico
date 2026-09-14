import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { ADMIN_USER_ROLES, UsageMetric } from '../../enum/usage/usage_metric.enum.js';
import { currentPeriodKey } from '../../helpers/plan_limits.helper.js';

export type UsageCounts = {
  professionals: number;
  users: number;
  units: number;
  storageBytes: number;
  messagesMonth: number;
};

export class CountRepository {
  async execute(ctx: RequestContext): Promise<UsageCounts> {
    const tenantPrisma = getTenantPrisma();
    const period = currentPeriodKey();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const now = new Date();
      const [professionals, users, pendingAdmins, units, storage, messagesMonth] = await Promise.all([
        tx.professional.count({
          where: { tenantId: ctx.tenantId, active: true },
        }),
        tx.membership.count({
          where: {
            tenantId: ctx.tenantId,
            active: true,
            role: { in: [...ADMIN_USER_ROLES] },
          },
        }),
        tx.invitation.count({
          where: {
            tenantId: ctx.tenantId,
            acceptedAt: null,
            revokedAt: null,
            expiresAt: { gt: now },
            role: { in: [...ADMIN_USER_ROLES] },
          },
        }),
        tx.unit.count({ where: { tenantId: ctx.tenantId } }),
        tx.attachment.aggregate({
          where: { tenantId: ctx.tenantId, deletedAt: null },
          _sum: { sizeBytes: true },
        }),
        tx.message.count({
          where: {
            tenantId: ctx.tenantId,
            createdAt: {
              gte: new Date(`${period}-01T00:00:00.000Z`),
            },
          },
        }),
      ]);

      return {
        professionals,
        users: users + pendingAdmins,
        units,
        storageBytes: Number(storage._sum.sizeBytes ?? 0),
        messagesMonth,
      };
    });
  }

  currentFor(counts: UsageCounts, metric: UsageMetric): number {
    switch (metric) {
      case UsageMetric.PROFESSIONALS:
        return counts.professionals;
      case UsageMetric.USERS:
        return counts.users;
      case UsageMetric.UNITS:
        return counts.units;
      case UsageMetric.STORAGE_BYTES:
        return counts.storageBytes;
      case UsageMetric.MESSAGES_MONTH:
        return counts.messagesMonth;
      default:
        return 0;
    }
  }
}

export class FindRepository {
  async execute(ctx: RequestContext, metric: string, period: string): Promise<number | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.usageCounter.findFirst({
        where: { tenantId: ctx.tenantId, metric, period },
        select: { value: true },
      });
      return row ? Number(row.value) : null;
    });
  }
}

export class UpsertRepository {
  async execute(
    ctx: RequestContext,
    metric: string,
    period: string,
    value: number,
  ): Promise<void> {
    const tenantPrisma = getTenantPrisma();
    await tenantPrisma.runInTenantContext(ctx, async (tx) => {
      await tx.usageCounter.upsert({
        where: {
          tenantId_metric_period: {
            tenantId: ctx.tenantId,
            metric,
            period,
          },
        },
        create: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          metric,
          period,
          value,
        },
        update: { value },
      });
    });
  }
}

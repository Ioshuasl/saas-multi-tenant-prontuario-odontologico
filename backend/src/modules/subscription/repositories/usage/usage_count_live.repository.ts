import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { UsageMetric } from '../../enum/usage/usage_metric.enum.js';

/** Papéis administrativos (não-dentista) — espelha identity Role sem cruzar BC. */
const ADMIN_ROLES = new Set(['OWNER', 'RECEPTION', 'ASSISTANT', 'FINANCE']);

/** Contagens ao vivo para PlanLimitGuard / GET usage. */
export class CountLiveRepository {
  async execute(
    ctx: RequestContext,
    metric: UsageMetric,
  ): Promise<number> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      switch (metric) {
        case UsageMetric.PROFESSIONALS:
          return tx.professional.count({
            where: { tenantId: ctx.tenantId, active: true },
          });
        case UsageMetric.ADMIN_USERS: {
          const rows = await tx.membership.findMany({
            where: { tenantId: ctx.tenantId, active: true },
            select: { role: true },
          });
          return rows.filter((r) => ADMIN_ROLES.has(r.role)).length;
        }
        case UsageMetric.UNITS:
          return tx.unit.count({ where: { tenantId: ctx.tenantId } });
        case UsageMetric.STORAGE_BYTES: {
          const agg = await tx.attachment.aggregate({
            where: { tenantId: ctx.tenantId, deletedAt: null },
            _sum: { sizeBytes: true },
          });
          return Number(agg._sum.sizeBytes ?? 0n);
        }
        case UsageMetric.MESSAGES_MONTH: {
          const period = currentMonthPeriod();
          const start = new Date(`${period}-01T00:00:00.000Z`);
          return tx.message.count({
            where: {
              tenantId: ctx.tenantId,
              direction: 'OUTBOUND',
              createdAt: { gte: start },
            },
          });
        }
        case UsageMetric.PATIENTS:
          return tx.patient.count({
            where: { tenantId: ctx.tenantId, deletedAt: null },
          });
        default:
          return 0;
      }
    });
  }
}

function currentMonthPeriod(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

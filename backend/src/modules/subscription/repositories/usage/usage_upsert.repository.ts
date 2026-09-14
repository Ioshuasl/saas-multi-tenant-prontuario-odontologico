import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { USAGE_PERIOD_CURRENT, type UsageMetric } from '../../enum/usage/usage_metric.enum.js';

export class UpsertRepository {
  async execute(
    ctx: RequestContext,
    metric: UsageMetric,
    value: number,
    period: string = USAGE_PERIOD_CURRENT,
  ): Promise<void> {
    const tenantPrisma = getTenantPrisma();
    await tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const existing = await tx.usageCounter.findUnique({
        where: {
          tenantId_metric_period: {
            tenantId: ctx.tenantId,
            metric,
            period,
          },
        },
      });
      if (existing) {
        await tx.usageCounter.update({
          where: { id: existing.id },
          data: { value: BigInt(value) },
        });
        return;
      }
      await tx.usageCounter.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          metric,
          period,
          value: BigInt(value),
        },
      });
    });
  }
}

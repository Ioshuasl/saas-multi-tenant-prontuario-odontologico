import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UsageMetric, USAGE_PERIOD_CURRENT } from '../../enum/usage/usage_metric.enum.js';
import { GetRepository } from '../../repositories/subscription/subscription_get.repository.js';
import { PlanLimitGuard } from '../plan_limit/plan_limit_guard.service.js';
import type { UsageSummary } from '../../types/subscription.types.js';

const METRICS: UsageMetric[] = [
  UsageMetric.PROFESSIONALS,
  UsageMetric.ADMIN_USERS,
  UsageMetric.UNITS,
  UsageMetric.STORAGE_BYTES,
  UsageMetric.MESSAGES_MONTH,
  UsageMetric.PATIENTS,
];

export class GetService {
  constructor(
    private readonly subscriptionGet = new GetRepository(),
    private readonly guard = new PlanLimitGuard(),
  ) {}

  async execute(ctx: RequestContext): Promise<UsageSummary> {
    const sub = await this.subscriptionGet.execute(ctx);
    const items = [];
    for (const metric of METRICS) {
      const { current, limit } = await this.guard.getUsage(ctx, metric);
      items.push({
        metric,
        current,
        limit,
        period:
          metric === UsageMetric.MESSAGES_MONTH
            ? currentMonthPeriod()
            : USAGE_PERIOD_CURRENT,
      });
    }
    void sub;
    return { items };
  }
}

function currentMonthPeriod(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

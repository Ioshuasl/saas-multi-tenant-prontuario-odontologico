import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UsageMetric } from '../../enum/usage/usage_metric.enum.js';
import { limitForMetric } from '../../helpers/plan_limits.helper.js';
import { SubscriptionRequiredError } from '../../models/errors/subscription.errors.js';
import { GetRepository } from '../../repositories/subscription/subscription.repository.js';
import { CountRepository } from '../../repositories/usage/usage.repository.js';
import type { UsageGetResult, UsageMetricSnapshot } from '../../types/subscription/subscription.types.js';

export class GetService {
  constructor(
    private readonly getSubscription = new GetRepository(),
    private readonly countUsage = new CountRepository(),
  ) {}

  async execute(ctx: RequestContext): Promise<UsageGetResult> {
    const snapshot = await this.getSubscription.execute(ctx);
    if (!snapshot) throw new SubscriptionRequiredError();
    const counts = await this.countUsage.execute(ctx);
    const limits = snapshot.plan.limits;
    return {
      professionals: snapshotOf(UsageMetric.PROFESSIONALS, counts.professionals, limits),
      users: snapshotOf(UsageMetric.USERS, counts.users, limits),
      units: snapshotOf(UsageMetric.UNITS, counts.units, limits),
      storageBytes: snapshotOf(UsageMetric.STORAGE_BYTES, counts.storageBytes, limits),
      messagesMonth: snapshotOf(UsageMetric.MESSAGES_MONTH, counts.messagesMonth, limits),
    };
  }
}

function snapshotOf(
  metric: UsageMetric,
  current: number,
  limits: Parameters<typeof limitForMetric>[0],
): UsageMetricSnapshot {
  return { metric, current, limit: limitForMetric(limits, metric) };
}

import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UsageMetric } from '../../enum/usage/usage_metric.enum.js';
import { PlanLimitExceededError } from '../../models/errors/subscription.errors.js';
import { limitForMetric } from '../../helpers/plan_limits.helper.js';
import { GetRepository } from '../../repositories/subscription/subscription.repository.js';
import { CountRepository } from '../../repositories/usage/usage.repository.js';

export class LimitService {
  constructor(
    private readonly getSubscription = new GetRepository(),
    private readonly countUsage = new CountRepository(),
  ) {}

  async assertCanAdd(ctx: RequestContext, metric: UsageMetric, amount = 1): Promise<void> {
    const snapshot = await this.getSubscription.execute(ctx);
    if (!snapshot) return;

    const limit = limitForMetric(snapshot.plan.limits, metric);
    if (limit === null) return;

    const counts = await this.countUsage.execute(ctx);
    const current = this.countUsage.currentFor(counts, metric);
    if (current + amount > limit) {
      throw new PlanLimitExceededError(metric, limit, current);
    }
  }
}

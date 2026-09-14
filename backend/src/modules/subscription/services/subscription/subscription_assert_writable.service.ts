import type { RequestContext } from '../../../../shared/domain/request_context.js';
import {
  READ_ONLY_SUBSCRIPTION_STATUSES,
  SubscriptionStatus,
} from '../../enum/subscription/subscription_status.enum.js';
import { SubscriptionRequiredError } from '../../models/errors/subscription.errors.js';
import { GetRepository } from '../../repositories/subscription/subscription_get.repository.js';

export class AssertWritableService {
  constructor(private readonly get = new GetRepository()) {}

  async execute(ctx: RequestContext): Promise<void> {
    const sub = await this.get.execute(ctx);
    if (!sub) return;
    if (READ_ONLY_SUBSCRIPTION_STATUSES.has(sub.status)) {
      throw new SubscriptionRequiredError(sub.status);
    }
    if (
      sub.status === SubscriptionStatus.TRIAL &&
      sub.trialEndsAt &&
      new Date(sub.trialEndsAt).getTime() <= Date.now()
    ) {
      throw new SubscriptionRequiredError(SubscriptionStatus.EXPIRED);
    }
  }

  async isReadOnly(ctx: RequestContext): Promise<boolean> {
    const sub = await this.get.execute(ctx);
    if (!sub) return false;
    if (READ_ONLY_SUBSCRIPTION_STATUSES.has(sub.status)) return true;
    if (
      sub.status === SubscriptionStatus.TRIAL &&
      sub.trialEndsAt &&
      new Date(sub.trialEndsAt).getTime() <= Date.now()
    ) {
      return true;
    }
    return false;
  }
}

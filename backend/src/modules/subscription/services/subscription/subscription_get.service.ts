import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { SubscriptionRequiredError } from '../../models/errors/subscription.errors.js';
import { SubscriptionState } from '../../models/subscription/subscription.model.js';
import { ListRepository } from '../../repositories/plan/plan.repository.js';
import { GetRepository } from '../../repositories/subscription/subscription.repository.js';
import type { PlanSummary } from '../../types/plan/plan.types.js';
import type { SubscriptionGetResult } from '../../types/subscription/subscription.types.js';

const CONTACT = 'Fale conosco para ativar ou reativar o plano.';

export class GetService {
  constructor(private readonly getSubscription = new GetRepository()) {}

  async execute(ctx: RequestContext): Promise<SubscriptionGetResult> {
    const snapshot = await this.getSubscription.execute(ctx);
    if (!snapshot) {
      throw new SubscriptionRequiredError();
    }
    const writable = SubscriptionState.isWritable(snapshot.status, snapshot.currentPeriodEnd);
    return {
      id: snapshot.id,
      status: snapshot.status,
      writable,
      plan: snapshot.plan,
      trialEndsAt: snapshot.trialEndsAt?.toISOString() ?? null,
      currentPeriodEnd: snapshot.currentPeriodEnd?.toISOString() ?? null,
      daysRemaining: SubscriptionState.daysRemaining(snapshot.currentPeriodEnd),
      contactMessage: CONTACT,
    };
  }
}

export class ListService {
  constructor(private readonly listPlans = new ListRepository()) {}

  async execute(ctx: RequestContext): Promise<PlanSummary[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, (tx) => this.listPlans.execute(tx));
  }
}

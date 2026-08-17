import type { DbTransaction } from '../../shared/database/db_transaction.js';
import type { RequestContext } from '../../shared/domain/request_context.js';
import { DEFAULT_PLAN_CODE } from './enum/plan/plan_code.enum.js';
import { SubscriptionStatus } from './enum/subscription/subscription_status.enum.js';
import { ADMIN_USER_ROLES, UsageMetric } from './enum/usage/usage_metric.enum.js';
import { SubscriptionRequiredError } from './models/errors/subscription.errors.js';
import { SubscriptionState } from './models/subscription/subscription.model.js';
import { GetByCodeRepository } from './repositories/plan/plan.repository.js';
import { GetRepository, SeedRepository } from './repositories/subscription/subscription.repository.js';
import { LimitService } from './services/plan/plan_limit.service.js';

const getSubscription = new GetRepository();
const seedSubscription = new SeedRepository();
const getPlanByCode = new GetByCodeRepository();
const planLimit = new LimitService();

export async function seedSubscriptionOnSignup(
  tx: DbTransaction,
  input: { tenantId: string; trialEndsAt: Date; idNext: () => string },
): Promise<void> {
  const plan = await getPlanByCode.execute(tx, DEFAULT_PLAN_CODE);
  if (!plan) {
    throw new Error('Plano ESSENCIAL não encontrado — rode as migrations.');
  }
  await seedSubscription.executeInTx(tx, {
    tenantId: input.tenantId,
    planId: plan.id,
    status: SubscriptionStatus.TRIAL,
    trialEndsAt: input.trialEndsAt,
    idNext: input.idNext,
  });
}

export async function assertWritable(ctx: RequestContext): Promise<void> {
  const snapshot = await getSubscription.execute(ctx);
  if (!snapshot) {
    throw new SubscriptionRequiredError();
  }
  if (!SubscriptionState.isWritable(snapshot.status, snapshot.currentPeriodEnd)) {
    throw new SubscriptionRequiredError();
  }
}

export async function canAutomate(ctx: RequestContext): Promise<boolean> {
  const snapshot = await getSubscription.execute(ctx);
  if (!snapshot) return false;
  return SubscriptionState.isWritable(snapshot.status, snapshot.currentPeriodEnd);
}

export async function assertCanAdd(
  ctx: RequestContext,
  metric: UsageMetric,
  amount = 1,
): Promise<void> {
  await planLimit.assertCanAdd(ctx, metric, amount);
}

export function countsTowardUserLimit(role: string): boolean {
  return (ADMIN_USER_ROLES as readonly string[]).includes(role);
}

export { UsageMetric };
export type { PlanSummary } from './types/plan/plan.types.js';
export type { SubscriptionGetResult, UsageGetResult } from './types/subscription/subscription.types.js';

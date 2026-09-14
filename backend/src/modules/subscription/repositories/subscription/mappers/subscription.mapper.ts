import type { Plan, Subscription } from '@prisma/client';
import { mapPlan } from '../../plan/mappers/plan.mapper.js';
import type { SubscriptionSummary } from '../../../types/subscription.types.js';

type SubscriptionWithPlan = Subscription & { plan: Plan };

export function mapSubscription(row: SubscriptionWithPlan): SubscriptionSummary {
  return {
    id: row.id,
    tenantId: row.tenantId,
    status: row.status,
    trialEndsAt: row.trialEndsAt?.toISOString() ?? null,
    currentPeriodEnd: row.currentPeriodEnd?.toISOString() ?? null,
    cancelAt: row.cancelAt?.toISOString() ?? null,
    plan: mapPlan(row.plan),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

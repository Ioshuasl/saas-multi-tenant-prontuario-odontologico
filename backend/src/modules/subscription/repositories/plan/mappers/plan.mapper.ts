import type { Plan } from '@prisma/client';
import { parsePlanLimits } from '../../../helpers/plan_limits.helper.js';
import type { PlanSummary } from '../../../types/subscription.types.js';

export function mapPlan(row: Plan): PlanSummary {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    priceCents: Number(row.priceCents),
    interval: row.interval,
    limits: parsePlanLimits(row.limits),
    active: row.active,
  };
}

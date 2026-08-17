import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import type { PlanSummary } from '../../types/plan/plan.types.js';
import { parsePlanLimits } from '../../helpers/plan_limits.helper.js';

export function mapPlan(row: {
  id: string;
  code: string;
  name: string;
  priceCents: bigint;
  interval: string;
  limits: unknown;
  active: boolean;
}): PlanSummary {
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

export class ListRepository {
  async execute(tx: DbTransaction): Promise<PlanSummary[]> {
    const rows = await tx.plan.findMany({
      where: { active: true },
      orderBy: { priceCents: 'asc' },
    });
    return rows.map(mapPlan);
  }
}

export class GetByCodeRepository {
  async execute(tx: DbTransaction, code: string): Promise<PlanSummary | null> {
    const row = await tx.plan.findFirst({ where: { code, active: true } });
    return row ? mapPlan(row) : null;
  }
}

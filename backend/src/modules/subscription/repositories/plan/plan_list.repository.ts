import { getPrismaClient } from '../../../../shared/database/tenant_prisma.js';
import { mapPlan } from './mappers/plan.mapper.js';
import type { PlanSummary } from '../../types/subscription.types.js';

export class ListRepository {
  async execute(): Promise<PlanSummary[]> {
    const prisma = getPrismaClient();
    const rows = await prisma.plan.findMany({
      where: { active: true },
      orderBy: { priceCents: 'asc' },
    });
    return rows.map(mapPlan);
  }
}

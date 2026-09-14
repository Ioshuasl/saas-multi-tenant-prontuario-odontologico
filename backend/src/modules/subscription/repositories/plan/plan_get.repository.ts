import { getPrismaClient } from '../../../../shared/database/tenant_prisma.js';
import { mapPlan } from './mappers/plan.mapper.js';
import type { PlanSummary } from '../../types/subscription.types.js';

export class GetByCodeRepository {
  async execute(code: string): Promise<PlanSummary | null> {
    const prisma = getPrismaClient();
    const row = await prisma.plan.findUnique({ where: { code } });
    return row ? mapPlan(row) : null;
  }
}

export class GetByIdRepository {
  async execute(planId: string): Promise<PlanSummary | null> {
    const prisma = getPrismaClient();
    const row = await prisma.plan.findUnique({ where: { id: planId } });
    return row ? mapPlan(row) : null;
  }
}

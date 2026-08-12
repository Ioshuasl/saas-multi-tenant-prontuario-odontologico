import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { ChairSummary } from '../../types/clinic.types.js';

export class ListChairsRepository {
  async execute(ctx: RequestContext, unitId: string): Promise<ChairSummary[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.chair.findMany({
        where: { tenantId: ctx.tenantId, unitId },
        orderBy: { name: 'asc' },
        select: { id: true, unitId: true, name: true, color: true, active: true },
      });
      return rows;
    });
  }
}

export class FindChairByNameRepository {
  async execute(
    ctx: RequestContext,
    unitId: string,
    name: string,
    excludeId?: string,
  ): Promise<boolean> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const found = await tx.chair.findFirst({
        where: {
          tenantId: ctx.tenantId,
          unitId,
          name: { equals: name, mode: 'insensitive' },
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      });
      return Boolean(found);
    });
  }
}

export class GetChairRepository {
  async execute(ctx: RequestContext, unitId: string, chairId: string): Promise<ChairSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      return tx.chair.findFirst({
        where: { id: chairId, unitId, tenantId: ctx.tenantId },
        select: { id: true, unitId: true, name: true, color: true, active: true },
      });
    });
  }
}

export class UpdateChairRepository {
  async execute(
    ctx: RequestContext,
    unitId: string,
    chairId: string,
    input: { name?: string; color?: string | null; active?: boolean },
  ): Promise<ChairSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const existing = await tx.chair.findFirst({
        where: { id: chairId, unitId, tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!existing) return null;

      return tx.chair.update({
        where: { id: chairId },
        data: {
          name: input.name,
          color: input.color,
          active: input.active,
        },
        select: { id: true, unitId: true, name: true, color: true, active: true },
      });
    });
  }
}

export class CreateChairRepository {
  async execute(
    ctx: RequestContext,
    unitId: string,
    input: { name: string; color?: string | null },
  ): Promise<ChairSummary> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      return tx.chair.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          unitId,
          name: input.name,
          color: input.color ?? null,
        },
        select: { id: true, unitId: true, name: true, color: true, active: true },
      });
    });
  }
}

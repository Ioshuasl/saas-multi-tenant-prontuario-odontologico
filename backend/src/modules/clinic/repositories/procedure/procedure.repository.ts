import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { centsToNumber } from '../../helpers/time.helper.js';
import type { ProcedureSummary } from '../../types/clinic.types.js';

function mapProcedure(row: {
  id: string;
  code: string;
  name: string;
  specialty: string | null;
  defaultMinutes: number;
  priceCents: bigint;
  requiresTooth: boolean;
  requiresFace: boolean;
  active: boolean;
}): ProcedureSummary {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    specialty: row.specialty,
    defaultMinutes: row.defaultMinutes,
    priceCents: centsToNumber(row.priceCents),
    requiresTooth: row.requiresTooth,
    requiresFace: row.requiresFace,
    active: row.active,
  };
}

const procedureSelect = {
  id: true,
  code: true,
  name: true,
  specialty: true,
  defaultMinutes: true,
  priceCents: true,
  requiresTooth: true,
  requiresFace: true,
  active: true,
} as const;

export class ListProceduresRepository {
  async execute(
    ctx: RequestContext,
    filter?: { search?: string; specialty?: string; active?: boolean },
  ): Promise<ProcedureSummary[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.procedure.findMany({
        where: {
          tenantId: ctx.tenantId,
          ...(filter?.specialty ? { specialty: filter.specialty } : {}),
          ...(filter?.active !== undefined ? { active: filter.active } : {}),
          ...(filter?.search
            ? {
                OR: [
                  { name: { contains: filter.search, mode: 'insensitive' } },
                  { code: { contains: filter.search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: [{ active: 'desc' }, { code: 'asc' }],
        select: procedureSelect,
      });
      return rows.map(mapProcedure);
    });
  }
}

export class GetProcedureRepository {
  async execute(ctx: RequestContext, procedureId: string): Promise<ProcedureSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.procedure.findFirst({
        where: { id: procedureId, tenantId: ctx.tenantId },
        select: procedureSelect,
      });
      return row ? mapProcedure(row) : null;
    });
  }
}

export class FindByCodeRepository {
  async execute(ctx: RequestContext, code: string): Promise<boolean> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const found = await tx.procedure.findFirst({
        where: { tenantId: ctx.tenantId, code: { equals: code, mode: 'insensitive' } },
        select: { id: true },
      });
      return Boolean(found);
    });
  }
}

export class CreateProcedureRepository {
  async execute(
    ctx: RequestContext,
    input: {
      code: string;
      name: string;
      specialty?: string | null;
      defaultMinutes: number;
      priceCents: number;
      requiresTooth?: boolean;
      requiresFace?: boolean;
    },
  ): Promise<ProcedureSummary> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.procedure.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          code: input.code,
          name: input.name,
          specialty: input.specialty ?? null,
          defaultMinutes: input.defaultMinutes,
          priceCents: BigInt(input.priceCents),
          requiresTooth: input.requiresTooth ?? false,
          requiresFace: input.requiresFace ?? false,
        },
        select: procedureSelect,
      });
      return mapProcedure(row);
    });
  }
}

export class UpdateProcedureRepository {
  async execute(
    ctx: RequestContext,
    procedureId: string,
    input: {
      name?: string;
      specialty?: string | null;
      defaultMinutes?: number;
      priceCents?: number;
      requiresTooth?: boolean;
      requiresFace?: boolean;
      active?: boolean;
    },
  ): Promise<ProcedureSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const existing = await tx.procedure.findFirst({
        where: { id: procedureId, tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!existing) return null;

      const row = await tx.procedure.update({
        where: { id: procedureId },
        data: {
          name: input.name,
          specialty: input.specialty,
          defaultMinutes: input.defaultMinutes,
          priceCents: input.priceCents !== undefined ? BigInt(input.priceCents) : undefined,
          requiresTooth: input.requiresTooth,
          requiresFace: input.requiresFace,
          active: input.active,
        },
        select: procedureSelect,
      });
      return mapProcedure(row);
    });
  }
}

export class CreateManyIfMissingRepository {
  async execute(
    ctx: RequestContext,
    items: Array<{
      code: string;
      name: string;
      specialty: string;
      defaultMinutes: number;
      requiresTooth: boolean;
      requiresFace?: boolean;
    }>,
  ): Promise<{ imported: number; skipped: number }> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      let imported = 0;
      let skipped = 0;
      for (const item of items) {
        const exists = await tx.procedure.findFirst({
          where: {
            tenantId: ctx.tenantId,
            code: { equals: item.code, mode: 'insensitive' },
          },
          select: { id: true },
        });
        if (exists) {
          skipped += 1;
          continue;
        }
        await tx.procedure.create({
          data: {
            id: idGenerator.next(),
            tenantId: ctx.tenantId,
            code: item.code,
            name: item.name,
            specialty: item.specialty,
            defaultMinutes: item.defaultMinutes,
            priceCents: BigInt(0),
            requiresTooth: item.requiresTooth,
            requiresFace: item.requiresFace ?? false,
          },
        });
        imported += 1;
      }
      return { imported, skipped };
    });
  }
}

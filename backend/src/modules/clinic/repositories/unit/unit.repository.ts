import type { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { ClinicAddress, UnitSummary } from '../../types/clinic.types.js';

function mapAddress(value: unknown): ClinicAddress | null {
  if (!value || typeof value !== 'object') return null;
  return value;
}

function mapUnit(row: {
  id: string;
  name: string;
  isDefault: boolean;
  phone: string | null;
  address: unknown;
}): UnitSummary {
  return {
    id: row.id,
    name: row.name,
    isDefault: row.isDefault,
    phone: row.phone,
    address: mapAddress(row.address),
  };
}

export class ListUnitsRepository {
  async execute(ctx: RequestContext): Promise<UnitSummary[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.unit.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        select: { id: true, name: true, isDefault: true, phone: true, address: true },
      });
      return rows.map(mapUnit);
    });
  }
}

export class GetUnitRepository {
  async execute(ctx: RequestContext, unitId: string): Promise<UnitSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.unit.findFirst({
        where: { id: unitId, tenantId: ctx.tenantId },
        select: { id: true, name: true, isDefault: true, phone: true, address: true },
      });
      return row ? mapUnit(row) : null;
    });
  }
}

export class FindByNameRepository {
  async execute(ctx: RequestContext, name: string, excludeId?: string): Promise<boolean> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const found = await tx.unit.findFirst({
        where: {
          tenantId: ctx.tenantId,
          name: { equals: name, mode: 'insensitive' },
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      });
      return Boolean(found);
    });
  }
}

export class CreateUnitRepository {
  async execute(
    ctx: RequestContext,
    input: {
      name: string;
      phone?: string | null;
      address?: ClinicAddress | null;
      isDefault?: boolean;
    },
  ): Promise<UnitSummary> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const id = idGenerator.next();
      if (input.isDefault) {
        await tx.unit.updateMany({
          where: { tenantId: ctx.tenantId, isDefault: true },
          data: { isDefault: false },
        });
      }
      const row = await tx.unit.create({
        data: {
          id,
          tenantId: ctx.tenantId,
          name: input.name,
          phone: input.phone ?? null,
          address: (input.address ?? undefined),
          isDefault: input.isDefault ?? false,
        },
        select: { id: true, name: true, isDefault: true, phone: true, address: true },
      });
      return mapUnit(row);
    });
  }
}

export class UpdateUnitRepository {
  async execute(
    ctx: RequestContext,
    unitId: string,
    input: {
      name?: string;
      phone?: string | null;
      address?: ClinicAddress | null;
      isDefault?: boolean;
    },
  ): Promise<UnitSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const existing = await tx.unit.findFirst({
        where: { id: unitId, tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!existing) return null;

      if (input.isDefault) {
        await tx.unit.updateMany({
          where: { tenantId: ctx.tenantId, isDefault: true, id: { not: unitId } },
          data: { isDefault: false },
        });
      }

      const row = await tx.unit.update({
        where: { id: unitId },
        data: {
          name: input.name,
          phone: input.phone,
          address:
            input.address === undefined
              ? undefined
              : ((input.address ?? undefined) as Prisma.InputJsonValue | undefined),
          isDefault: input.isDefault,
        },
        select: { id: true, name: true, isDefault: true, phone: true, address: true },
      });
      return mapUnit(row);
    });
  }
}

export async function seedDefaultHoursForUnit(
  tx: DbTransaction,
  tenantId: string,
  unitId: string,
): Promise<void> {
  const start = new Date('1970-01-01T08:00:00.000Z');
  const end = new Date('1970-01-01T18:00:00.000Z');
  for (const weekday of [1, 2, 3, 4, 5]) {
    await tx.businessHours.create({
      data: {
        id: idGenerator.next(),
        tenantId,
        unitId,
        weekday,
        startsAt: start,
        endsAt: end,
      },
    });
  }
}

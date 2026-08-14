import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getPrismaClient, getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export type ClinicLetterhead = {
  name: string;
  legalName: string | null;
  taxId: string | null;
  responsibleCro: string | null;
  timezone: string;
  phone: string | null;
  addressLine: string | null;
};

function addressLine(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const parts = [row.street, row.number, row.district, row.city, row.state, row.postalCode]
    .filter((part) => typeof part === 'string' && part.length > 0)
    .join(', ');
  return parts.length > 0 ? parts : null;
}

export class GetLetterheadRepository {
  async execute(ctx: RequestContext, unitId: string): Promise<ClinicLetterhead | null> {
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      const tenant = await tx.tenant.findFirst({
        where: { id: ctx.tenantId },
        select: {
          name: true,
          legalName: true,
          taxId: true,
          responsibleCro: true,
          timezone: true,
        },
      });
      if (!tenant) return null;
      const unit = await tx.unit.findFirst({
        where: { id: unitId, tenantId: ctx.tenantId },
        select: { phone: true, address: true },
      });
      return {
        name: tenant.name,
        legalName: tenant.legalName,
        taxId: tenant.taxId,
        responsibleCro: tenant.responsibleCro,
        timezone: tenant.timezone,
        phone: unit?.phone ?? null,
        addressLine: addressLine(unit?.address),
      };
    });
  }
}

export class ListTenantsForJobsRepository {
  async execute(): Promise<Array<{ id: string; timezone: string }>> {
    return getPrismaClient().tenant.findMany({
      select: { id: true, timezone: true },
    });
  }
}

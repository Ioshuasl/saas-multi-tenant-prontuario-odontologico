import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { ProfessionalSummary } from '../../types/clinic.types.js';

const professionalSelect = {
  id: true,
  membershipId: true,
  croNumber: true,
  croState: true,
  specialties: true,
  color: true,
  active: true,
  membership: {
    select: {
      userId: true,
      role: true,
      user: { select: { name: true, email: true } },
    },
  },
} as const;

function mapProfessional(row: {
  id: string;
  membershipId: string;
  croNumber: string | null;
  croState: string | null;
  specialties: string[];
  color: string | null;
  active: boolean;
  membership: {
    userId: string;
    role: string;
    user: { name: string; email: string } | null;
  };
}): ProfessionalSummary {
  return {
    id: row.id,
    membershipId: row.membershipId,
    userId: row.membership.userId,
    name: row.membership.user?.name ?? '',
    email: row.membership.user?.email ?? '',
    role: row.membership.role,
    croNumber: row.croNumber,
    croState: row.croState,
    specialties: row.specialties,
    color: row.color,
    active: row.active,
  };
}

export class ListProfessionalsRepository {
  async execute(ctx: RequestContext): Promise<ProfessionalSummary[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.professional.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: [{ active: 'desc' }, { id: 'asc' }],
        select: professionalSelect,
      });
      return rows.map(mapProfessional);
    });
  }
}

export class GetProfessionalRepository {
  async execute(ctx: RequestContext, professionalId: string): Promise<ProfessionalSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.professional.findFirst({
        where: { id: professionalId, tenantId: ctx.tenantId },
        select: professionalSelect,
      });
      return row ? mapProfessional(row) : null;
    });
  }
}

export class FindByMembershipRepository {
  async execute(ctx: RequestContext, membershipId: string): Promise<boolean> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const found = await tx.professional.findFirst({
        where: { tenantId: ctx.tenantId, membershipId },
        select: { id: true },
      });
      return Boolean(found);
    });
  }
}

export class GetMembershipRepository {
  async execute(
    ctx: RequestContext,
    membershipId: string,
  ): Promise<{ id: string; role: string; active: boolean } | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      return tx.membership.findFirst({
        where: { id: membershipId, tenantId: ctx.tenantId },
        select: { id: true, role: true, active: true },
      });
    });
  }
}

export class CreateProfessionalRepository {
  async execute(
    ctx: RequestContext,
    input: {
      membershipId: string;
      croNumber?: string | null;
      croState?: string | null;
      specialties?: string[];
      color?: string | null;
    },
  ): Promise<ProfessionalSummary> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.professional.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          membershipId: input.membershipId,
          croNumber: input.croNumber ?? null,
          croState: input.croState ?? null,
          specialties: input.specialties ?? [],
          color: input.color ?? null,
        },
        select: professionalSelect,
      });
      return mapProfessional(row);
    });
  }
}

export class UpdateProfessionalRepository {
  async execute(
    ctx: RequestContext,
    professionalId: string,
    input: {
      croNumber?: string | null;
      croState?: string | null;
      specialties?: string[];
      color?: string | null;
      active?: boolean;
    },
  ): Promise<ProfessionalSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const existing = await tx.professional.findFirst({
        where: { id: professionalId, tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!existing) return null;

      const row = await tx.professional.update({
        where: { id: professionalId },
        data: {
          croNumber: input.croNumber,
          croState: input.croState,
          specialties: input.specialties,
          color: input.color,
          active: input.active,
        },
        select: professionalSelect,
      });
      return mapProfessional(row);
    });
  }
}

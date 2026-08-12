import type { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getPrismaClient, getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export type MembershipRow = {
  id: string;
  tenantId: string;
  userId: string;
  role: string;
  permissions: unknown;
  active: boolean;
  defaultUnitId?: string | null;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  user?: {
    id: string;
    email: string;
    name: string;
  };
};

const membershipSelect = {
  id: true,
  tenantId: true,
  userId: true,
  role: true,
  permissions: true,
  active: true,
  defaultUnitId: true,
  tenant: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} as const;

export class CreateRepository {
  async execute(
    tx: DbTransaction,
    input: {
      id: string;
      tenantId: string;
      userId: string;
      role: string;
      defaultUnitId?: string;
    },
  ): Promise<void> {
    await tx.membership.create({
      data: {
        id: input.id,
        tenantId: input.tenantId,
        userId: input.userId,
        role: input.role,
        defaultUnitId: input.defaultUnitId,
        permissions: {},
      },
    });
  }
}

export class ListActiveByUserRepository {
  async execute(userId: string): Promise<MembershipRow[]> {
    const prisma = getPrismaClient();
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
      return tx.membership.findMany({
        where: { userId, active: true },
        select: membershipSelect,
      });
    });
  }
}

export class GetByIdRepository {
  async execute(userId: string, membershipId: string): Promise<MembershipRow | null> {
    const prisma = getPrismaClient();
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
      return tx.membership.findFirst({
        where: { id: membershipId, userId, active: true },
        select: membershipSelect,
      });
    });
  }
}

export class GetByUserAndTenantRepository {
  async execute(userId: string, tenantId: string): Promise<MembershipRow | null> {
    const prisma = getPrismaClient();
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
      return tx.membership.findFirst({
        where: { userId, tenantId, active: true },
        select: membershipSelect,
      });
    });
  }
}

export class GetByUserInTenantRepository {
  async execute(
    ctx: RequestContext,
    userId: string,
  ): Promise<MembershipRow | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) =>
      tx.membership.findFirst({
        where: { userId, tenantId: ctx.tenantId },
        select: {
          ...membershipSelect,
          user: { select: { id: true, email: true, name: true } },
        },
      }),
    );
  }
}

export class ListByTenantRepository {
  async execute(ctx: RequestContext): Promise<MembershipRow[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) =>
      tx.membership.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { createdAt: 'asc' },
        select: {
          ...membershipSelect,
          user: { select: { id: true, email: true, name: true } },
        },
      }),
    );
  }
}

export class CountActiveOwnersRepository {
  async execute(ctx: RequestContext): Promise<number> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) =>
      tx.membership.count({
        where: { tenantId: ctx.tenantId, role: 'OWNER', active: true },
      }),
    );
  }
}

export class UpdateRepository {
  async execute(
    ctx: RequestContext,
    membershipId: string,
    membershipSchema: {
      role?: string;
      active?: boolean;
      defaultUnitId?: string | null;
      permissions?: unknown;
    },
  ): Promise<MembershipRow> {
    const tenantPrisma = getTenantPrisma();
    const data: Prisma.MembershipUncheckedUpdateInput = {};
    if (membershipSchema.role !== undefined) data.role = membershipSchema.role;
    if (membershipSchema.active !== undefined) data.active = membershipSchema.active;
    if (membershipSchema.defaultUnitId !== undefined) {
      data.defaultUnitId = membershipSchema.defaultUnitId;
    }
    if (membershipSchema.permissions !== undefined) {
      data.permissions = membershipSchema.permissions as Prisma.InputJsonValue;
    }

    return tenantPrisma.runInTenantContext(ctx, async (tx) =>
      tx.membership.update({
        where: { id: membershipId },
        data,
        select: {
          ...membershipSelect,
          user: { select: { id: true, email: true, name: true } },
        },
      }),
    );
  }
}

export class GetByUserTenantTxRepository {
  async execute(
    tx: DbTransaction,
    userId: string,
    tenantId: string,
  ): Promise<{ id: string } | null> {
    return tx.membership.findFirst({
      where: { userId, tenantId },
      select: { id: true },
    });
  }
}

export class GetByEmailInTenantRepository {
  async execute(ctx: RequestContext, email: string): Promise<MembershipRow | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) =>
      tx.membership.findFirst({
        where: {
          tenantId: ctx.tenantId,
          user: { email },
        },
        select: {
          ...membershipSelect,
          user: { select: { id: true, email: true, name: true } },
        },
      }),
    );
  }
}

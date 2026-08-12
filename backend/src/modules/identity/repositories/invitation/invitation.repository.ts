import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getPrismaClient, getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export type InvitationRow = {
  id: string;
  tenantId: string;
  email: string;
  role: string;
  tokenHash: string;
  invitedByUserId: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  tenant?: { id: string; name: string; slug: string };
};

const invitationSelect = {
  id: true,
  tenantId: true,
  email: true,
  role: true,
  tokenHash: true,
  invitedByUserId: true,
  expiresAt: true,
  acceptedAt: true,
  revokedAt: true,
  createdAt: true,
} as const;

export class CreateRepository {
  async execute(
    ctx: RequestContext,
    input: {
      id: string;
      email: string;
      role: string;
      tokenHash: string;
      invitedByUserId: string;
      expiresAt: Date;
    },
  ): Promise<InvitationRow> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) =>
      tx.invitation.create({
        data: {
          id: input.id,
          tenantId: ctx.tenantId,
          email: input.email,
          role: input.role,
          tokenHash: input.tokenHash,
          invitedByUserId: input.invitedByUserId,
          expiresAt: input.expiresAt,
        },
        select: invitationSelect,
      }),
    );
  }
}

export class ListRepository {
  async execute(ctx: RequestContext): Promise<InvitationRow[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) =>
      tx.invitation.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { createdAt: 'desc' },
        select: invitationSelect,
      }),
    );
  }
}

export class GetByIdRepository {
  async execute(ctx: RequestContext, invitationId: string): Promise<InvitationRow | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) =>
      tx.invitation.findFirst({
        where: { id: invitationId, tenantId: ctx.tenantId },
        select: invitationSelect,
      }),
    );
  }
}

export class GetPendingByEmailRepository {
  async execute(ctx: RequestContext, email: string): Promise<InvitationRow | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) =>
      tx.invitation.findFirst({
        where: {
          tenantId: ctx.tenantId,
          email,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: invitationSelect,
      }),
    );
  }
}

export class UpdateTokenRepository {
  async execute(
    ctx: RequestContext,
    invitationId: string,
    input: { tokenHash: string; expiresAt: Date },
  ): Promise<InvitationRow> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) =>
      tx.invitation.update({
        where: { id: invitationId },
        data: { tokenHash: input.tokenHash, expiresAt: input.expiresAt },
        select: invitationSelect,
      }),
    );
  }
}

export class RevokeRepository {
  async execute(ctx: RequestContext, invitationId: string): Promise<void> {
    const tenantPrisma = getTenantPrisma();
    await tenantPrisma.runInTenantContext(ctx, async (tx) => {
      await tx.invitation.update({
        where: { id: invitationId },
        data: { revokedAt: new Date() },
      });
    });
  }
}

export class GetByTokenHashRepository {
  async execute(tokenHash: string, tx?: DbTransaction): Promise<InvitationRow | null> {
    const run = async (client: DbTransaction | ReturnType<typeof getPrismaClient>) => {
      // Convite público: SELECT só via hash. Tenant exige app.tenant_id depois.
      await client.$executeRaw`SELECT set_config('app.invitation_token_hash', ${tokenHash}, true)`;
      const invitation = await client.invitation.findUnique({
        where: { tokenHash },
        select: invitationSelect,
      });
      if (!invitation) return null;

      await client.$executeRaw`SELECT set_config('app.tenant_id', ${invitation.tenantId}, true)`;
      const tenant = await client.tenant.findUnique({
        where: { id: invitation.tenantId },
        select: { id: true, name: true, slug: true },
      });

      return { ...invitation, tenant: tenant ?? undefined };
    };

    if (tx) return run(tx);
    const prisma = getPrismaClient();
    return prisma.$transaction(async (inner) => run(inner));
  }
}

export class AcceptRepository {
  async execute(tx: DbTransaction, invitationId: string): Promise<void> {
    await tx.invitation.update({
      where: { id: invitationId },
      data: { acceptedAt: new Date() },
    });
  }
}

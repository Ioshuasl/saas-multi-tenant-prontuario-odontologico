import { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getPrismaClient, getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { mapAccount } from '../../helpers/messaging_mapper.helper.js';
import type { WhatsappAccountSummary } from '../../types/messaging.types.js';

export type WhatsappAccountRow = WhatsappAccountSummary & {
  accessTokenRef: string;
};

export class GetAccountRepository {
  async execute(ctx: RequestContext): Promise<WhatsappAccountRow | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.whatsappAccount.findFirst({ where: { tenantId: ctx.tenantId } });
      if (!row) return null;
      return { ...mapAccount(row), accessTokenRef: row.accessTokenRef };
    });
  }
}

export class UpsertAccountRepository {
  async execute(
    ctx: RequestContext,
    input: {
      wabaId: string;
      phoneNumberId: string;
      displayPhone: string;
      accessTokenRef: string;
      unitId?: string | null;
      status: string;
      lastError?: string | null;
    },
  ): Promise<WhatsappAccountSummary> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const existing = await tx.whatsappAccount.findFirst({ where: { tenantId: ctx.tenantId } });
      const row = existing
        ? await tx.whatsappAccount.update({
            where: { id: existing.id },
            data: {
              wabaId: input.wabaId,
              phoneNumberId: input.phoneNumberId,
              displayPhone: input.displayPhone,
              accessTokenRef: input.accessTokenRef,
              unitId: input.unitId ?? null,
              status: input.status,
              lastError: input.lastError ?? null,
              killSwitch: false,
            },
          })
        : await tx.whatsappAccount.create({
            data: {
              id: idGenerator.next(),
              tenantId: ctx.tenantId,
              wabaId: input.wabaId,
              phoneNumberId: input.phoneNumberId,
              displayPhone: input.displayPhone,
              accessTokenRef: input.accessTokenRef,
              unitId: input.unitId ?? null,
              status: input.status,
              lastError: input.lastError ?? null,
            },
          });
      return mapAccount(row);
    });
  }
}

export class UpdateAccountRepository {
  async execute(
    ctx: RequestContext,
    patch: {
      status?: string;
      killSwitch?: boolean;
      lastError?: string | null;
      webhookVerifiedAt?: Date | null;
    },
  ): Promise<WhatsappAccountSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const existing = await tx.whatsappAccount.findFirst({ where: { tenantId: ctx.tenantId } });
      if (!existing) return null;
      const row = await tx.whatsappAccount.update({
        where: { id: existing.id },
        data: patch,
      });
      return mapAccount(row);
    });
  }
}

export class ResolveAccountByPhoneNumberIdRepository {
  async execute(phoneNumberId: string): Promise<{ id: string; tenantId: string; status: string; killSwitch: boolean } | null> {
    const prisma = getPrismaClient();
    const rows = await prisma.$queryRaw<
      Array<{ id: string; tenant_id: string; status: string; kill_switch: boolean }>
    >(Prisma.sql`SELECT * FROM platform.resolve_whatsapp_account_by_phone_number_id(${phoneNumberId})`);
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      tenantId: row.tenant_id,
      status: row.status,
      killSwitch: row.kill_switch,
    };
  }
}

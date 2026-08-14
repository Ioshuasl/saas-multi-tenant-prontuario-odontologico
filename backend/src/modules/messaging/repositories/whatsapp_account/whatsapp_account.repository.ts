import { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getPrismaClient, getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { mapAccount } from '../../helpers/messaging_mapper.helper.js';
import type { WhatsappAccountSummary } from '../../types/messaging.types.js';

export class GetAccountRepository {
  async execute(ctx: RequestContext): Promise<WhatsappAccountSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.whatsappAccount.findFirst({ where: { tenantId: ctx.tenantId } });
      if (!row) return null;
      return mapAccount(row);
    });
  }
}

export class UpsertAccountRepository {
  async execute(
    ctx: RequestContext,
    input: {
      sessionName: string;
      riskAcceptedAt: Date;
      unitId?: string | null;
      status: string;
      lastError?: string | null;
      displayPhone?: string | null;
    },
  ): Promise<WhatsappAccountSummary> {
    const prisma = getPrismaClient();
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        session_name: string;
        display_phone: string | null;
        status: string;
        kill_switch: boolean;
        last_error: string | null;
        risk_accepted_at: Date | null;
        webhook_verified_at: Date | null;
        created_at: Date;
      }>
    >(Prisma.sql`
      SELECT * FROM platform.upsert_whatsapp_account_for_session(
        ${idGenerator.next()}::uuid,
        ${ctx.tenantId}::uuid,
        ${input.sessionName},
        ${input.riskAcceptedAt},
        ${input.unitId ?? null}::uuid,
        ${input.status},
        ${input.lastError ?? null},
        ${input.displayPhone ?? null}
      )
    `);
    const row = rows[0];
    if (!row) {
      throw new Error('Falha ao gravar conta WhatsApp.');
    }
    return mapAccount({
      id: row.id,
      sessionName: row.session_name,
      displayPhone: row.display_phone,
      status: row.status,
      killSwitch: row.kill_switch,
      lastError: row.last_error,
      riskAcceptedAt: row.risk_accepted_at,
      webhookVerifiedAt: row.webhook_verified_at,
      createdAt: row.created_at,
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
      displayPhone?: string | null;
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

export class ResolveAccountBySessionNameRepository {
  async execute(sessionName: string): Promise<{ id: string; tenantId: string; status: string; killSwitch: boolean } | null> {
    const prisma = getPrismaClient();
    const rows = await prisma.$queryRaw<
      Array<{ id: string; tenant_id: string; status: string; kill_switch: boolean }>
    >(Prisma.sql`SELECT * FROM platform.resolve_whatsapp_account_by_session_name(${sessionName})`);
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

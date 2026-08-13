import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';

export class GetCreditBalanceRepository {
  async execute(ctx: RequestContext): Promise<{ balance: number; consumed: number; granted: number }> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.messageCreditLedger.findMany({
        where: { tenantId: ctx.tenantId },
        select: { kind: true, amountCents: true },
      });
      let granted = 0;
      let consumed = 0;
      for (const row of rows) {
        const amount = Number(row.amountCents);
        if (row.kind === 'CONSUMPTION') consumed += Math.abs(amount);
        if (row.kind === 'BONUS' || row.kind === 'PURCHASE' || row.kind === 'ADJUSTMENT') {
          granted += amount > 0 ? amount : 0;
        }
      }
      const balance = rows.reduce((sum, row) => sum + Number(row.amountCents), 0);
      return { balance, consumed, granted };
    });
  }
}

export class AppendCreditLedgerRepository {
  async execute(
    ctx: RequestContext,
    input: { kind: string; amountCents: number; messageId?: string | null },
  ): Promise<{ balanceAfter: number }> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const agg = await tx.messageCreditLedger.aggregate({
        where: { tenantId: ctx.tenantId },
        _sum: { amountCents: true },
      });
      const current = Number(agg._sum.amountCents ?? 0n);
      const balanceAfter = current + input.amountCents;
      await tx.messageCreditLedger.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          kind: input.kind,
          amountCents: BigInt(input.amountCents),
          messageId: input.messageId ?? null,
          balanceAfterCents: BigInt(balanceAfter),
        },
      });
      return { balanceAfter };
    });
  }
}

export class GetTenantMessagingContextRepository {
  async execute(ctx: RequestContext): Promise<{
    name: string;
    timezone: string;
    courtesyTransactionalMessages: number;
  }> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.tenant.findFirst({
        where: { id: ctx.tenantId },
        select: { name: true, timezone: true, bookingSettings: true },
      });
      const settings = row?.bookingSettings;
      const courtesy =
        settings && typeof settings === 'object' && 'courtesyTransactionalMessages' in settings
          ? Number((settings as { courtesyTransactionalMessages?: unknown }).courtesyTransactionalMessages)
          : 50;
      return {
        name: row?.name ?? 'Clínica',
        timezone: row?.timezone ?? 'America/Sao_Paulo',
        courtesyTransactionalMessages: Number.isFinite(courtesy) ? courtesy : 50,
      };
    });
  }
}

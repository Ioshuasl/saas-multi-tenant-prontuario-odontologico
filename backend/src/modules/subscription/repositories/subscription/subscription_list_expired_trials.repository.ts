import { getPrismaClient, getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

const SYSTEM_USER = '00000000-0000-0000-0000-000000000000';

/** Lista tenants em TRIAL com trial_ends_at vencido (scan por tenant + RLS). */
export class ListExpiredTrialsRepository {
  async execute(now: Date): Promise<Array<{ tenantId: string; subscriptionId: string }>> {
    const prisma = getPrismaClient();
    const tenants = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.provisioning', 'on', true)`;
      return tx.tenant.findMany({ select: { id: true } });
    });

    const tenantPrisma = getTenantPrisma();
    const expired: Array<{ tenantId: string; subscriptionId: string }> = [];

    for (const tenant of tenants) {
      const row = await tenantPrisma.runInTenantContext(
        {
          tenantId: tenant.id,
          userId: SYSTEM_USER,
          requestId: 'trial-expire-scan',
        },
        async (tx) =>
          tx.subscription.findFirst({
            where: {
              tenantId: tenant.id,
              status: 'TRIAL',
              trialEndsAt: { lte: now },
            },
            select: { id: true, tenantId: true },
          }),
      );
      if (row) {
        expired.push({ tenantId: row.tenantId, subscriptionId: row.id });
      }
    }

    return expired;
  }
}

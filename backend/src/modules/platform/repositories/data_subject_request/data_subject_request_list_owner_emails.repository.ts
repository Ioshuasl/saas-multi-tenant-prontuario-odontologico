import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class ListOwnerEmailsRepository {
  async execute(ctx: RequestContext): Promise<Array<{ email: string; clinicName: string }>> {
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      const tenant = await tx.tenant.findFirst({
        where: { id: ctx.tenantId },
        select: { name: true },
      });
      const owners = await tx.membership.findMany({
        where: { tenantId: ctx.tenantId, role: 'OWNER', active: true },
        select: { user: { select: { email: true } } },
      });
      return owners
        .map((row) => row.user.email)
        .filter((email) => email.length > 0)
        .map((email) => ({ email, clinicName: tenant?.name ?? 'Clínica' }));
    });
  }
}

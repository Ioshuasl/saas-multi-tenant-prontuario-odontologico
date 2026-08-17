import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

export class TenantExistsRepository {
  async execute(tenantId: string): Promise<boolean> {
    const ctx: RequestContext = {
      tenantId,
      userId: SYSTEM_USER_ID,
      requestId: 'support-access-tenant',
    };
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      const row = await tx.tenant.findFirst({
        where: { id: tenantId },
        select: { id: true },
      });
      return Boolean(row);
    });
  }
}

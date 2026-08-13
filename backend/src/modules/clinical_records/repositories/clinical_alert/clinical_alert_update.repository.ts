import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class UpdateRepository {
  async execute(
    ctx: RequestContext,
    alertId: string,
    patch: { active: boolean },
  ): Promise<void> {
    const tenantPrisma = getTenantPrisma();
    await tenantPrisma.runInTenantContext(ctx, async (tx) => {
      await tx.clinicalAlert.update({
        where: { id: alertId },
        data: { active: patch.active },
      });
    });
  }
}

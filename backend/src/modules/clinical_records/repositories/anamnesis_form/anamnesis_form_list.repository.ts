import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { AnamnesisFormSummary } from '../../types/anamnesis_form/anamnesis_form.types.js';
import { mapAnamnesisForm } from './mappers/anamnesis_form.mapper.js';

export class ListRepository {
  async execute(ctx: RequestContext): Promise<AnamnesisFormSummary[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.anamnesisForm.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: [{ name: 'asc' }, { version: 'desc' }],
      });
      return rows.map(mapAnamnesisForm);
    });
  }
}

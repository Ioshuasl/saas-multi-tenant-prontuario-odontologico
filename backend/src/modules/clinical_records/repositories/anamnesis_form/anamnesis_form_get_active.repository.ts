import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { AnamnesisFormSummary } from '../../types/anamnesis_form/anamnesis_form.types.js';
import { mapAnamnesisForm } from './mappers/anamnesis_form.mapper.js';

export class GetActiveRepository {
  async execute(ctx: RequestContext, name?: string): Promise<AnamnesisFormSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.anamnesisForm.findFirst({
        where: {
          tenantId: ctx.tenantId,
          active: true,
          ...(name ? { name } : {}),
        },
        orderBy: [{ name: 'asc' }, { version: 'desc' }],
      });
      return row ? mapAnamnesisForm(row) : null;
    });
  }
}

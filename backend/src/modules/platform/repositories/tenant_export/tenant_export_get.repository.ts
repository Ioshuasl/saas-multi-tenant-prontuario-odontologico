import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { TenantExportRow } from '../../types/tenant_export/tenant_export.types.js';
import { mapTenantExport } from './mappers/tenant_export.mapper.js';

export class GetRepository {
  async execute(ctx: RequestContext, exportId: string): Promise<TenantExportRow | null> {
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      const row = await tx.tenantExport.findFirst({
        where: { id: exportId, tenantId: ctx.tenantId },
      });
      return row ? mapTenantExport(row) : null;
    });
  }
}

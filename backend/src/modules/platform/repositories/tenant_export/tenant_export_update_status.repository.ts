import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { TenantExportStatus } from '../../enum/tenant_export/tenant_export_status.enum.js';

export class UpdateStatusRepository {
  async execute(
    ctx: RequestContext,
    exportId: string,
    input: { status: TenantExportStatus; storageKey?: string | null; error?: string | null },
  ): Promise<void> {
    await getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      await this.executeInTx(tx, ctx, exportId, input);
    });
  }

  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    exportId: string,
    input: { status: TenantExportStatus; storageKey?: string | null; error?: string | null },
  ): Promise<void> {
    await tx.tenantExport.updateMany({
      where: { id: exportId, tenantId: ctx.tenantId },
      data: {
        status: input.status,
        ...(input.storageKey !== undefined ? { storageKey: input.storageKey } : {}),
        ...(input.error !== undefined ? { error: input.error } : {}),
      },
    });
  }
}

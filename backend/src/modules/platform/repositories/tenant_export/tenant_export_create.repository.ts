import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { TenantExportRow } from '../../types/tenant_export/tenant_export.types.js';
import { mapTenantExport } from './mappers/tenant_export.mapper.js';

export class CreateRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    input: { idempotencyKey?: string },
  ): Promise<TenantExportRow> {
    const row = await tx.tenantExport.create({
      data: {
        id: idGenerator.next(),
        tenantId: ctx.tenantId,
        status: 'PENDING',
        requestedBy: ctx.userId,
        idempotencyKey: input.idempotencyKey,
      },
    });
    return mapTenantExport(row);
  }
}

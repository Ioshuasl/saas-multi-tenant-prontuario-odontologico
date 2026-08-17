import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { IdempotencyKeyReusedError } from '../../models/errors/tenant_export.errors.js';
import { CreateRepository } from '../../repositories/tenant_export/tenant_export_create.repository.js';
import { GetByIdempotencyKeyRepository } from '../../repositories/tenant_export/tenant_export_get_by_idempotency_key.repository.js';
import type { TenantExportCreateSchema } from '../../schemas/tenant_export.schema.js';
import type { TenantExportCreateResult } from '../../types/tenant_export/tenant_export.types.js';

export class CreateAction {
  constructor(
    private readonly uow = new UnitOfWork(),
    private readonly create = new CreateRepository(),
    private readonly getByKey = new GetByIdempotencyKeyRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    _tenantExportSchema: TenantExportCreateSchema,
    extra?: { idempotencyKey?: string },
  ): Promise<TenantExportCreateResult> {
    const idempotencyKey = extra?.idempotencyKey;
    if (idempotencyKey) {
      const existing = await this.getByKey.execute(ctx, idempotencyKey);
      if (existing) {
        throw new IdempotencyKeyReusedError();
      }
    }

    try {
      const row = await this.uow.run(ctx, async ({ tx, publish }) => {
        const created = await this.create.executeInTx(tx, ctx, { idempotencyKey });
        publish([
          {
            name: 'platform.tenant_export_requested',
            payload: {
              exportId: created.id,
              requestId: ctx.requestId,
            },
          },
        ]);
        return created;
      });

      await writeAuditLogSafe({
        tenantId: ctx.tenantId,
        actorId: ctx.userId,
        action: AuditAction.EXPORT_REQUESTED,
        resourceType: 'tenant_export',
        resourceId: row.id,
      });

      return { exportId: row.id, status: row.status };
    } catch (err) {
      const code = err && typeof err === 'object' ? String((err as { code?: string }).code ?? '') : '';
      if (idempotencyKey && (code === 'P2002' || code === '23505')) {
        throw new IdempotencyKeyReusedError();
      }
      throw err;
    }
  }
}

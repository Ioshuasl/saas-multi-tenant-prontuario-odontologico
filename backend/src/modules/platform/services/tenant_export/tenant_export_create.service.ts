import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { CreateAction } from '../../actions/tenant_export/tenant_export_create.action.js';
import type { TenantExportCreateSchema } from '../../schemas/tenant_export.schema.js';
import type { TenantExportCreateResult } from '../../types/tenant_export/tenant_export.types.js';

export class CreateService {
  constructor(private readonly createAction = new CreateAction()) {}

  async execute(
    ctx: RequestContext,
    tenantExportSchema: TenantExportCreateSchema,
    extra?: { idempotencyKey?: string },
  ): Promise<TenantExportCreateResult> {
    return this.createAction.execute(ctx, tenantExportSchema, extra);
  }
}

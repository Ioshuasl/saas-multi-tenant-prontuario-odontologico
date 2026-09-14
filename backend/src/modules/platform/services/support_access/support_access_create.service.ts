import type { RequestContext } from '../../../../shared/domain/request_context.js';
import {
  assertSupportAccessReason,
  resolveSupportAccessHours,
} from '../../models/support_access/support_access.guard.js';
import { SupportAccessTenantNotFoundError } from '../../models/errors/support_access.errors.js';
import { CreateRepository } from '../../repositories/support_access/support_access_create.repository.js';
import { TenantExistsRepository } from '../../repositories/support_access/support_access_tenant_exists.repository.js';
import type { SupportAccessCreateSchema } from '../../schemas/support_access.schema.js';
import type { SupportAccessRow } from '../../types/support_access/support_access.types.js';

export class CreateService {
  constructor(
    private readonly tenants = new TenantExistsRepository(),
    private readonly create = new CreateRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    supportAccessSchema: SupportAccessCreateSchema,
  ): Promise<SupportAccessRow> {
    assertSupportAccessReason(supportAccessSchema.reason);
    const hours = resolveSupportAccessHours(supportAccessSchema.hours);
    const exists = await this.tenants.execute(supportAccessSchema.tenantId);
    if (!exists) throw new SupportAccessTenantNotFoundError();
    return this.create.execute({
      tenantId: supportAccessSchema.tenantId,
      requesterId: ctx.userId,
      reason: supportAccessSchema.reason,
      hours,
    });
  }
}

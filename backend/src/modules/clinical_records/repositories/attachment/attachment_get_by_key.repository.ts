import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { AttachmentSummary } from '../../types/attachment/attachment_list.types.js';
import { mapAttachment } from './mappers/attachment.mapper.js';

export class GetByKeyRepository {
  async execute(ctx: RequestContext, storageKey: string): Promise<AttachmentSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.attachment.findFirst({
        where: { tenantId: ctx.tenantId, storageKey, deletedAt: null },
      });
      return row ? mapAttachment(row) : null;
    });
  }
}

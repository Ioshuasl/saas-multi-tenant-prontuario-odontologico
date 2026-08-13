import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { AttachmentListResult } from '../../types/attachment/attachment_list.types.js';
import { mapAttachment } from './mappers/attachment.mapper.js';

export class ListRepository {
  async execute(
    ctx: RequestContext,
    patientId: string,
    filter?: { category?: string },
  ): Promise<AttachmentListResult> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.attachment.findMany({
        where: {
          tenantId: ctx.tenantId,
          patientId,
          deletedAt: null,
          ...(filter?.category ? { category: filter.category } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });
      return { items: rows.map(mapAttachment) };
    });
  }
}

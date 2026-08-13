import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class UpdateThumbnailRepository {
  async execute(ctx: RequestContext, attachmentId: string, thumbnailKey: string): Promise<void> {
    const tenantPrisma = getTenantPrisma();
    await tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const existing = await tx.attachment.findFirst({
        where: { id: attachmentId, tenantId: ctx.tenantId, deletedAt: null },
        select: { id: true, thumbnailKey: true },
      });
      if (!existing || existing.thumbnailKey) return;
      await tx.attachment.update({
        where: { id: attachmentId },
        data: { thumbnailKey },
      });
    });
  }
}

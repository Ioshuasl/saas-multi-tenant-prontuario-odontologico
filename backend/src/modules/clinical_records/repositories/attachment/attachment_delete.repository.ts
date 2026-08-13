import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { Attachment } from '../../models/attachment/attachment.model.js';
import type { AttachmentSummary } from '../../types/attachment/attachment_list.types.js';
import { mapAttachment } from './mappers/attachment.mapper.js';

export class DeleteRepository {
  async execute(ctx: RequestContext, attachment: Attachment): Promise<AttachmentSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const existing = await tx.attachment.findFirst({
        where: { id: attachment.props.id, tenantId: ctx.tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!existing) return null;

      const row = await tx.attachment.update({
        where: { id: attachment.props.id },
        data: {
          deletedAt: attachment.props.deletedAt,
          deletedReason: attachment.props.deletedReason,
          deletedBy: attachment.props.deletedBy,
        },
      });
      return mapAttachment(row);
    });
  }
}

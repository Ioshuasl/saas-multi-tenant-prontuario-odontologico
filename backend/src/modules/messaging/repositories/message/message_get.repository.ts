import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { mapInboxMessage } from '../../helpers/messaging_mapper.helper.js';
import type { InboxMessage } from '../../types/message/message.types.js';

export class GetRepository {
  async execute(ctx: RequestContext, messageId: string): Promise<InboxMessage | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.message.findFirst({
        where: { id: messageId, tenantId: ctx.tenantId },
      });
      return row ? mapInboxMessage(row) : null;
    });
  }
}

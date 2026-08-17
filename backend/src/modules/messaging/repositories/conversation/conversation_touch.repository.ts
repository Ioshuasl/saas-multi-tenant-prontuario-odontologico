import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class TouchRepository {
  async execute(
    ctx: RequestContext,
    conversationId: string,
    patch: { lastMessageAt: Date; patientId?: string },
  ): Promise<void> {
    const tenantPrisma = getTenantPrisma();
    await tenantPrisma.runInTenantContext(ctx, async (tx) => {
      await tx.conversation.updateMany({
        where: { id: conversationId, tenantId: ctx.tenantId },
        data: {
          lastMessageAt: patch.lastMessageAt,
          ...(patch.patientId ? { patientId: patch.patientId } : {}),
        },
      });
    });
  }
}

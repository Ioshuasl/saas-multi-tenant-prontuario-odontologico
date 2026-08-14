import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';

export class UpsertConversationRepository {
  async execute(
    ctx: RequestContext,
    input: {
      whatsappAccountId: string;
      contactPhone: string;
      contactName?: string | null;
      patientId?: string | null;
      serviceWindowExpiresAt?: Date | null;
    },
  ): Promise<{ id: string; status: string }> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const existing = await tx.conversation.findFirst({
        where: {
          tenantId: ctx.tenantId,
          whatsappAccountId: input.whatsappAccountId,
          contactPhone: input.contactPhone,
        },
      });
      if (existing) {
        const row = await tx.conversation.update({
          where: { id: existing.id },
          data: {
            lastMessageAt: new Date(),
            ...(input.contactName ? { contactName: input.contactName } : {}),
            ...(input.patientId && !existing.patientId ? { patientId: input.patientId } : {}),
            ...(input.serviceWindowExpiresAt ? { serviceWindowExpiresAt: input.serviceWindowExpiresAt } : {}),
          },
        });
        return { id: row.id, status: row.status };
      }
      const row = await tx.conversation.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          whatsappAccountId: input.whatsappAccountId,
          contactPhone: input.contactPhone,
          contactName: input.contactName ?? null,
          patientId: input.patientId ?? null,
          lastMessageAt: new Date(),
          serviceWindowExpiresAt: input.serviceWindowExpiresAt ?? null,
        },
      });
      return { id: row.id, status: row.status };
    });
  }
}

export class UpdateConversationStatusRepository {
  async execute(ctx: RequestContext, conversationId: string, status: string): Promise<void> {
    const tenantPrisma = getTenantPrisma();
    await tenantPrisma.runInTenantContext(ctx, async (tx) => {
      await tx.conversation.updateMany({
        where: { id: conversationId, tenantId: ctx.tenantId },
        data: { status },
      });
    });
  }
}

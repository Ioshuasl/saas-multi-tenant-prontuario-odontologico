import type { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { mapInboxMessage } from '../../helpers/messaging_mapper.helper.js';
import type { MessageListResult } from '../../types/message/message.types.js';

export class ListByPatientRepository {
  async execute(
    ctx: RequestContext,
    patientId: string,
    input: { cursor?: string; limit: number },
  ): Promise<MessageListResult> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const where: Prisma.MessageWhereInput = {
        tenantId: ctx.tenantId,
        conversation: { patientId },
      };

      if (input.cursor) {
        const cursorRow = await tx.message.findFirst({
          where: { id: input.cursor, tenantId: ctx.tenantId, conversation: { patientId } },
          select: { id: true, createdAt: true },
        });
        if (cursorRow) {
          where.OR = [
            { createdAt: { lt: cursorRow.createdAt } },
            { createdAt: cursorRow.createdAt, id: { lt: cursorRow.id } },
          ];
        }
      }

      const rows = await tx.message.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: input.limit + 1,
      });
      const page = rows.slice(0, input.limit);
      return {
        items: page.map(mapInboxMessage),
        nextCursor: rows.length > input.limit ? (page[page.length - 1]?.id ?? null) : null,
      };
    });
  }
}

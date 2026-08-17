import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { PatientMessageTimelineItem } from '../../types/message/message_timeline.types.js';

export class ListTimelineByPatientRepository {
  async execute(
    ctx: RequestContext,
    patientId: string,
    limit: number,
  ): Promise<PatientMessageTimelineItem[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.message.findMany({
        where: {
          tenantId: ctx.tenantId,
          conversation: { patientId },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit,
        select: {
          id: true,
          conversationId: true,
          direction: true,
          type: true,
          body: true,
          createdAt: true,
        },
      });
      return rows.map((row) => ({
        id: row.id,
        conversationId: row.conversationId,
        direction: row.direction,
        type: row.type,
        body: row.body,
        occurredAt: row.createdAt.toISOString(),
      }));
    });
  }
}

import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { Dentition } from '../../enum/tooth_state/dentition.enum.js';
import { reconstructAt, mapTooth, type ToothStateRow } from './mappers/tooth_state.mapper.js';
import type { OdontogramTooth } from '../../types/odontogram/odontogram_get.types.js';

export class ListRepository {
  async execute(
    ctx: RequestContext,
    medicalRecordId: string,
    dentition: Dentition,
    at: Date | null,
  ): Promise<OdontogramTooth[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.toothState.findMany({
        where: { tenantId: ctx.tenantId, medicalRecordId, dentition },
        include: {
          history: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: [{ toothCode: 'asc' }, { face: 'asc' }],
      });
      const mapped: ToothStateRow[] = rows.map((row) => ({
        id: row.id,
        dentition: row.dentition,
        toothCode: row.toothCode,
        face: row.face,
        condition: row.condition,
        notes: row.notes,
        recordedBy: row.recordedBy,
        recordedAt: row.recordedAt,
        history: row.history.map((h) => ({
          fromCondition: h.fromCondition,
          toCondition: h.toCondition,
          source: h.source,
          actorId: h.actorId,
          createdAt: h.createdAt,
        })),
      }));
      if (at) return reconstructAt(mapped, at);
      return mapped.map((row) => mapTooth(row, true));
    });
  }
}

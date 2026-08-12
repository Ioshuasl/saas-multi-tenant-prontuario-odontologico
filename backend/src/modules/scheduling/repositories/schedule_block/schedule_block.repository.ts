import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type {
  AppointmentConflictSummary,
  ScheduleBlockSummary,
} from '../../types/scheduling.types.js';

function mapBlock(
  row: {
    id: string;
    unitId: string;
    professionalId: string | null;
    chairId: string | null;
    startsAt: Date;
    endsAt: Date;
    reason: string;
    createdAt: Date;
  },
  conflicts: AppointmentConflictSummary[],
): ScheduleBlockSummary {
  return {
    id: row.id,
    unitId: row.unitId,
    professionalId: row.professionalId,
    chairId: row.chairId,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    reason: row.reason,
    createdAt: row.createdAt.toISOString(),
    conflicts,
  };
}

export class CreateScheduleBlockRepository {
  async execute(
    ctx: RequestContext,
    input: {
      unitId: string;
      professionalId?: string | null;
      chairId?: string | null;
      startsAt: Date;
      endsAt: Date;
      reason: string;
    },
  ): Promise<ScheduleBlockSummary> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.scheduleBlock.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          unitId: input.unitId,
          professionalId: input.professionalId ?? null,
          chairId: input.chairId ?? null,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          reason: input.reason,
        },
      });

      const appointments = await tx.appointment.findMany({
        where: {
          tenantId: ctx.tenantId,
          unitId: input.unitId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          startsAt: { lt: input.endsAt },
          endsAt: { gt: input.startsAt },
          ...(input.professionalId ? { professionalId: input.professionalId } : {}),
          ...(input.chairId ? { chairId: input.chairId } : {}),
        },
        select: { id: true, startsAt: true, endsAt: true },
        orderBy: { startsAt: 'asc' },
        take: 100,
      });

      const conflicts = appointments.map((a) => ({
        appointmentId: a.id,
        startsAt: a.startsAt.toISOString(),
        endsAt: a.endsAt.toISOString(),
      }));

      return mapBlock(row, conflicts);
    });
  }
}

export class GetScheduleBlockRepository {
  async execute(ctx: RequestContext, blockId: string): Promise<ScheduleBlockSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.scheduleBlock.findFirst({
        where: { id: blockId, tenantId: ctx.tenantId },
      });
      return row ? mapBlock(row, []) : null;
    });
  }
}

export class DeleteScheduleBlockRepository {
  async execute(ctx: RequestContext, blockId: string): Promise<boolean> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const existing = await tx.scheduleBlock.findFirst({
        where: { id: blockId, tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!existing) return false;
      await tx.scheduleBlock.delete({ where: { id: blockId } });
      return true;
    });
  }
}

import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { formatTime, parseTime } from '../../helpers/time.helper.js';
import type {
  BusinessHoursExceptionSummary,
  BusinessHoursSlot,
} from '../../types/clinic.types.js';

export class ListHoursRepository {
  async execute(
    ctx: RequestContext,
    unitId: string,
    professionalId?: string | null,
  ): Promise<BusinessHoursSlot[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.businessHours.findMany({
        where: {
          tenantId: ctx.tenantId,
          unitId,
          professionalId: professionalId ?? null,
        },
        orderBy: [{ weekday: 'asc' }, { startsAt: 'asc' }],
        select: { id: true, weekday: true, startsAt: true, endsAt: true },
      });
      return rows.map((row) => ({
        id: row.id,
        weekday: row.weekday,
        startsAt: formatTime(row.startsAt),
        endsAt: formatTime(row.endsAt),
      }));
    });
  }
}

export class ReplaceHoursRepository {
  async execute(
    ctx: RequestContext,
    input: {
      unitId: string;
      professionalId?: string | null;
      slots: Array<{ weekday: number; startsAt: string; endsAt: string }>;
    },
  ): Promise<BusinessHoursSlot[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      await tx.businessHours.deleteMany({
        where: {
          tenantId: ctx.tenantId,
          unitId: input.unitId,
          professionalId: input.professionalId ?? null,
        },
      });

      const created: BusinessHoursSlot[] = [];
      for (const slot of input.slots) {
        const row = await tx.businessHours.create({
          data: {
            id: idGenerator.next(),
            tenantId: ctx.tenantId,
            unitId: input.unitId,
            professionalId: input.professionalId ?? null,
            weekday: slot.weekday,
            startsAt: parseTime(slot.startsAt),
            endsAt: parseTime(slot.endsAt),
          },
          select: { id: true, weekday: true, startsAt: true, endsAt: true },
        });
        created.push({
          id: row.id,
          weekday: row.weekday,
          startsAt: formatTime(row.startsAt),
          endsAt: formatTime(row.endsAt),
        });
      }
      return created;
    });
  }
}

export class CreateExceptionRepository {
  async execute(
    ctx: RequestContext,
    input: {
      unitId: string;
      professionalId?: string | null;
      date: string;
      closed: boolean;
      startsAt?: string | null;
      endsAt?: string | null;
      reason?: string | null;
    },
  ): Promise<BusinessHoursExceptionSummary> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.businessHoursException.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          unitId: input.unitId,
          professionalId: input.professionalId ?? null,
          date: new Date(`${input.date}T00:00:00.000Z`),
          closed: input.closed,
          startsAt: input.startsAt ? parseTime(input.startsAt) : null,
          endsAt: input.endsAt ? parseTime(input.endsAt) : null,
          reason: input.reason ?? null,
        },
        select: {
          id: true,
          unitId: true,
          professionalId: true,
          date: true,
          closed: true,
          startsAt: true,
          endsAt: true,
          reason: true,
        },
      });
      return {
        id: row.id,
        unitId: row.unitId,
        professionalId: row.professionalId,
        date: row.date.toISOString().slice(0, 10),
        closed: row.closed,
        startsAt: row.startsAt ? formatTime(row.startsAt) : null,
        endsAt: row.endsAt ? formatTime(row.endsAt) : null,
        reason: row.reason,
      };
    });
  }
}

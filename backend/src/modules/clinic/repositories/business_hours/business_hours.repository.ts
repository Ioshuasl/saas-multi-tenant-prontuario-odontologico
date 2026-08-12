import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { formatTime, parseTime } from '../../helpers/time.helper.js';
import { wallTimeToUtc } from '../../helpers/working_windows.helper.js';
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

function nextYmd(dateYmd: string): string {
  const [year, month, day] = dateYmd.split('-').map(Number);
  const utc = new Date(Date.UTC(year!, month! - 1, day! + 1));
  return utc.toISOString().slice(0, 10);
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
      const tenant = await tx.tenant.findFirst({
        where: { id: ctx.tenantId },
        select: { timezone: true },
      });
      const timezone = tenant?.timezone ?? 'America/Sao_Paulo';

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

      const dayStart = wallTimeToUtc(input.date, '00:00', timezone);
      const dayEnd = wallTimeToUtc(nextYmd(input.date), '00:00', timezone);
      const appointments = await tx.appointment.findMany({
        where: {
          tenantId: ctx.tenantId,
          unitId: input.unitId,
          ...(input.professionalId ? { professionalId: input.professionalId } : {}),
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          startsAt: { lt: dayEnd },
          endsAt: { gt: dayStart },
        },
        select: { id: true, startsAt: true, endsAt: true },
        orderBy: { startsAt: 'asc' },
        take: 100,
      });

      let conflicts = appointments.map((a) => ({
        appointmentId: a.id,
        startsAt: a.startsAt.toISOString(),
        endsAt: a.endsAt.toISOString(),
      }));

      if (!input.closed && input.startsAt && input.endsAt) {
        const openStart = wallTimeToUtc(input.date, input.startsAt, timezone);
        const openEnd = wallTimeToUtc(input.date, input.endsAt, timezone);
        conflicts = conflicts.filter(
          (c) =>
            new Date(c.startsAt) < openStart || new Date(c.endsAt) > openEnd,
        );
      }

      return {
        id: row.id,
        unitId: row.unitId,
        professionalId: row.professionalId,
        date: row.date.toISOString().slice(0, 10),
        closed: row.closed,
        startsAt: row.startsAt ? formatTime(row.startsAt) : null,
        endsAt: row.endsAt ? formatTime(row.endsAt) : null,
        reason: row.reason,
        conflicts,
      };
    });
  }
}

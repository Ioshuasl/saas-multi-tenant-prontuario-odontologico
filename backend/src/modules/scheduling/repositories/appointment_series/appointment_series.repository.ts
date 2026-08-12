import { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { mapAppointment } from '../../helpers/scheduling.helper.js';
import type {
  AppointmentSeriesSummary,
  AppointmentSummary,
  TimelineAppointmentItem,
} from '../../types/scheduling.types.js';

const appointmentInclude = {
  patient: { select: { id: true, name: true, phonePrimary: true } },
  professional: {
    select: {
      id: true,
      membership: { select: { user: { select: { name: true } } } },
    },
  },
  procedure: { select: { id: true, name: true, defaultMinutes: true } },
} satisfies Prisma.AppointmentInclude;

export class CreateSeriesRepository {
  async execute(
    ctx: RequestContext,
    input: {
      unitId: string;
      patientId: string;
      professionalId: string;
      chairId?: string | null;
      procedureId?: string | null;
      rrule: string;
      startsAt: Date;
      durationMinutes: number;
      notes?: string | null;
      occurrences: Date[];
    },
  ): Promise<AppointmentSeriesSummary> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const seriesId = idGenerator.next();
      await tx.appointmentSeries.create({
        data: {
          id: seriesId,
          tenantId: ctx.tenantId,
          unitId: input.unitId,
          patientId: input.patientId,
          professionalId: input.professionalId,
          chairId: input.chairId ?? null,
          procedureId: input.procedureId ?? null,
          rrule: input.rrule,
          startsAt: input.startsAt,
          durationMinutes: input.durationMinutes,
        },
      });

      const appointments: AppointmentSummary[] = [];
      for (const start of input.occurrences) {
        const endsAt = new Date(start.getTime() + input.durationMinutes * 60_000);
        const id = idGenerator.next();
        const row = await tx.appointment.create({
          data: {
            id,
            tenantId: ctx.tenantId,
            unitId: input.unitId,
            patientId: input.patientId,
            professionalId: input.professionalId,
            chairId: input.chairId ?? null,
            procedureId: input.procedureId ?? null,
            startsAt: start,
            endsAt,
            status: 'SCHEDULED',
            origin: 'RECURRENCE',
            notes: input.notes ?? null,
            recurrenceId: seriesId,
            createdBy: ctx.userId ?? null,
          },
          include: appointmentInclude,
        });

        await tx.appointmentHistory.create({
          data: {
            id: idGenerator.next(),
            tenantId: ctx.tenantId,
            appointmentId: id,
            action: 'CREATED',
            fromValue: Prisma.JsonNull,
            toValue: {
              status: row.status,
              startsAt: row.startsAt.toISOString(),
              endsAt: row.endsAt.toISOString(),
              seriesId,
            },
            actorId: ctx.userId ?? null,
            actorType: 'USER',
          },
        });

        appointments.push(mapAppointment(row));
      }

      return {
        id: seriesId,
        unitId: input.unitId,
        patientId: input.patientId,
        professionalId: input.professionalId,
        chairId: input.chairId ?? null,
        procedureId: input.procedureId ?? null,
        rrule: input.rrule,
        startsAt: input.startsAt.toISOString(),
        durationMinutes: input.durationMinutes,
        createdAt: new Date().toISOString(),
        appointments,
      };
    });
  }
}

export class GetSeriesRepository {
  async execute(ctx: RequestContext, seriesId: string): Promise<{
    id: string;
    appointments: Array<{ id: string; startsAt: Date; status: string }>;
  } | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const series = await tx.appointmentSeries.findFirst({
        where: { id: seriesId, tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!series) return null;

      const appointments = await tx.appointment.findMany({
        where: { tenantId: ctx.tenantId, recurrenceId: seriesId },
        select: { id: true, startsAt: true, status: true },
        orderBy: { startsAt: 'asc' },
      });

      return { id: series.id, appointments };
    });
  }
}

export class CancelSeriesAppointmentsRepository {
  async execute(
    ctx: RequestContext,
    input: {
      seriesId: string;
      appointmentIds: string[];
      reason: string;
      unlink?: boolean;
    },
  ): Promise<number> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      let cancelled = 0;
      for (const appointmentId of input.appointmentIds) {
        const current = await tx.appointment.findFirst({
          where: {
            id: appointmentId,
            tenantId: ctx.tenantId,
            recurrenceId: input.seriesId,
          },
        });
        if (!current || current.status === 'CANCELLED') continue;

        await tx.appointment.update({
          where: { id: appointmentId },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelReason: input.reason,
            ...(input.unlink ? { recurrenceId: null } : {}),
          },
        });

        await tx.appointmentHistory.create({
          data: {
            id: idGenerator.next(),
            tenantId: ctx.tenantId,
            appointmentId,
            action: 'CANCELLED',
            fromValue: { status: current.status },
            toValue: { status: 'CANCELLED', reason: input.reason, scope: true },
            actorId: ctx.userId ?? null,
            actorType: 'USER',
          },
        });
        cancelled += 1;
      }
      return cancelled;
    });
  }
}

export class ListPatientTimelineAppointmentsRepository {
  async execute(
    ctx: RequestContext,
    patientId: string,
    take = 50,
  ): Promise<TimelineAppointmentItem[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.appointment.findMany({
        where: { tenantId: ctx.tenantId, patientId },
        include: {
          procedure: { select: { name: true } },
          professional: {
            select: {
              membership: { select: { user: { select: { name: true } } } },
            },
          },
        },
        orderBy: { startsAt: 'desc' },
        take,
      });

      return rows.map((row) => ({
        id: row.id,
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt.toISOString(),
        status: row.status,
        origin: row.origin,
        procedureName: row.procedure?.name ?? null,
        professionalName: row.professional.membership?.user?.name ?? null,
      }));
    });
  }
}

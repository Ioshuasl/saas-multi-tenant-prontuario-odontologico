import { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { mapAppointment, mapHistory } from '../../helpers/scheduling.helper.js';
import type {
  AppointmentHistoryItem,
  AppointmentSummary,
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

export class ListAppointmentsRepository {
  async execute(
    ctx: RequestContext,
    input: {
      unitId?: string;
      professionalId?: string;
      chairId?: string;
      patientId?: string;
      status?: string;
      from?: Date;
      to?: Date;
    },
  ): Promise<AppointmentSummary[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.appointment.findMany({
        where: {
          tenantId: ctx.tenantId,
          ...(input.unitId ? { unitId: input.unitId } : {}),
          ...(input.professionalId ? { professionalId: input.professionalId } : {}),
          ...(input.chairId ? { chairId: input.chairId } : {}),
          ...(input.patientId ? { patientId: input.patientId } : {}),
          ...(input.status ? { status: input.status } : {}),
          ...(input.from || input.to
            ? {
                startsAt: {
                  ...(input.from ? { gte: input.from } : {}),
                  ...(input.to ? { lt: input.to } : {}),
                },
              }
            : {}),
        },
        include: appointmentInclude,
        orderBy: { startsAt: 'asc' },
        take: 500,
      });
      return rows.map(mapAppointment);
    });
  }
}

export class GetAppointmentRepository {
  async execute(ctx: RequestContext, appointmentId: string): Promise<AppointmentSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.appointment.findFirst({
        where: { id: appointmentId, tenantId: ctx.tenantId },
        include: appointmentInclude,
      });
      return row ? mapAppointment(row) : null;
    });
  }
}

export class FindByIdempotencyRepository {
  async execute(
    ctx: RequestContext,
    idempotencyKey: string,
  ): Promise<AppointmentSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.appointment.findFirst({
        where: { tenantId: ctx.tenantId, idempotencyKey },
        include: appointmentInclude,
      });
      return row ? mapAppointment(row) : null;
    });
  }
}

export class CreateAppointmentRepository {
  async execute(
    ctx: RequestContext,
    input: {
      unitId: string;
      patientId: string;
      professionalId: string;
      chairId?: string | null;
      procedureId?: string | null;
      startsAt: Date;
      endsAt: Date;
      status: string;
      origin: string;
      notes?: string | null;
      idempotencyKey?: string | null;
      createdBy?: string | null;
    },
  ): Promise<AppointmentSummary> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
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
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          status: input.status,
          origin: input.origin,
          notes: input.notes ?? null,
          idempotencyKey: input.idempotencyKey ?? null,
          createdBy: input.createdBy ?? ctx.userId ?? null,
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
            professionalId: row.professionalId,
            chairId: row.chairId,
          },
          actorId: ctx.userId ?? null,
          actorType: 'USER',
        },
      });

      return mapAppointment(row);
    });
  }
}

export class UpdateAppointmentRepository {
  async execute(
    ctx: RequestContext,
    appointmentId: string,
    patch: {
      professionalId?: string;
      chairId?: string | null;
      procedureId?: string | null;
      startsAt?: Date;
      endsAt?: Date;
      notes?: string | null;
      status?: string;
      confirmedAt?: Date | null;
      arrivedAt?: Date | null;
      cancelledAt?: Date | null;
      cancelReason?: string | null;
    },
    history: {
      action: string;
      fromValue: unknown;
      toValue: unknown;
    },
  ): Promise<AppointmentSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const existing = await tx.appointment.findFirst({
        where: { id: appointmentId, tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!existing) return null;

      const row = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          ...(patch.professionalId !== undefined
            ? { professionalId: patch.professionalId }
            : {}),
          ...(patch.chairId !== undefined ? { chairId: patch.chairId } : {}),
          ...(patch.procedureId !== undefined ? { procedureId: patch.procedureId } : {}),
          ...(patch.startsAt !== undefined ? { startsAt: patch.startsAt } : {}),
          ...(patch.endsAt !== undefined ? { endsAt: patch.endsAt } : {}),
          ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
          ...(patch.status !== undefined ? { status: patch.status } : {}),
          ...(patch.confirmedAt !== undefined ? { confirmedAt: patch.confirmedAt } : {}),
          ...(patch.arrivedAt !== undefined ? { arrivedAt: patch.arrivedAt } : {}),
          ...(patch.cancelledAt !== undefined ? { cancelledAt: patch.cancelledAt } : {}),
          ...(patch.cancelReason !== undefined ? { cancelReason: patch.cancelReason } : {}),
        },
        include: appointmentInclude,
      });

      await tx.appointmentHistory.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          appointmentId,
          action: history.action,
          fromValue: history.fromValue as Prisma.InputJsonValue,
          toValue: history.toValue as Prisma.InputJsonValue,
          actorId: ctx.userId ?? null,
          actorType: 'USER',
        },
      });

      return mapAppointment(row);
    });
  }
}

export class ListHistoryRepository {
  async execute(
    ctx: RequestContext,
    appointmentId: string,
  ): Promise<AppointmentHistoryItem[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.appointmentHistory.findMany({
        where: { tenantId: ctx.tenantId, appointmentId },
        orderBy: { createdAt: 'asc' },
      });
      return rows.map(mapHistory);
    });
  }
}

export class ListBusyIntervalsRepository {
  async execute(
    ctx: RequestContext,
    input: {
      unitId: string;
      professionalId: string;
      from: Date;
      to: Date;
      excludeAppointmentId?: string;
    },
  ): Promise<Array<{ id: string; startsAt: Date; endsAt: Date; kind: 'BOOKED' | 'BLOCKED' }>> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const appointments = await tx.appointment.findMany({
        where: {
          tenantId: ctx.tenantId,
          professionalId: input.professionalId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          startsAt: { lt: input.to },
          endsAt: { gt: input.from },
          ...(input.excludeAppointmentId
            ? { id: { not: input.excludeAppointmentId } }
            : {}),
        },
        select: { id: true, startsAt: true, endsAt: true },
      });

      const blocks = await tx.scheduleBlock.findMany({
        where: {
          tenantId: ctx.tenantId,
          unitId: input.unitId,
          startsAt: { lt: input.to },
          endsAt: { gt: input.from },
          OR: [{ professionalId: null }, { professionalId: input.professionalId }],
        },
        select: { id: true, startsAt: true, endsAt: true },
      });

      return [
        ...appointments.map((a) => ({
          id: a.id,
          startsAt: a.startsAt,
          endsAt: a.endsAt,
          kind: 'BOOKED' as const,
        })),
        ...blocks.map((b) => ({
          id: b.id,
          startsAt: b.startsAt,
          endsAt: b.endsAt,
          kind: 'BLOCKED' as const,
        })),
      ];
    });
  }
}

export class ListFutureByPatientRepository {
  async execute(ctx: RequestContext, patientId: string): Promise<string[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.appointment.findMany({
        where: {
          tenantId: ctx.tenantId,
          patientId,
          startsAt: { gt: new Date() },
          status: { notIn: ['CANCELLED', 'NO_SHOW', 'COMPLETED'] },
        },
        select: { id: true },
        take: 50,
      });
      return rows.map((r) => r.id);
    });
  }
}

export class GetProcedureMinutesRepository {
  async execute(ctx: RequestContext, procedureId: string): Promise<number | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.procedure.findFirst({
        where: { id: procedureId, tenantId: ctx.tenantId, active: true },
        select: { defaultMinutes: true },
      });
      return row?.defaultMinutes ?? null;
    });
  }
}

export class GetTenantTimezoneRepository {
  async execute(ctx: RequestContext): Promise<string> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.tenant.findFirst({
        where: { id: ctx.tenantId },
        select: { timezone: true },
      });
      return row?.timezone ?? 'America/Sao_Paulo';
    });
  }
}

export class GetDefaultUnitRepository {
  async execute(ctx: RequestContext): Promise<string | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.unit.findFirst({
        where: { tenantId: ctx.tenantId, isDefault: true },
        select: { id: true },
      });
      return row?.id ?? null;
    });
  }
}

export class AssertRefsRepository {
  async execute(
    ctx: RequestContext,
    input: {
      patientId: string;
      professionalId: string;
      chairId?: string | null;
      procedureId?: string | null;
      unitId: string;
    },
  ): Promise<{ ok: true } | { ok: false; message: string }> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const patient = await tx.patient.findFirst({
        where: {
          id: input.patientId,
          tenantId: ctx.tenantId,
          deletedAt: null,
          active: true,
        },
        select: { id: true },
      });
      if (!patient) return { ok: false, message: 'Paciente não encontrado.' };

      const professional = await tx.professional.findFirst({
        where: { id: input.professionalId, tenantId: ctx.tenantId, active: true },
        select: { id: true },
      });
      if (!professional) return { ok: false, message: 'Profissional não encontrado.' };

      const unit = await tx.unit.findFirst({
        where: { id: input.unitId, tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!unit) return { ok: false, message: 'Unidade não encontrada.' };

      if (input.chairId) {
        const chair = await tx.chair.findFirst({
          where: {
            id: input.chairId,
            tenantId: ctx.tenantId,
            unitId: input.unitId,
            active: true,
          },
          select: { id: true },
        });
        if (!chair) return { ok: false, message: 'Cadeira não encontrada.' };
      }

      if (input.procedureId) {
        const procedure = await tx.procedure.findFirst({
          where: { id: input.procedureId, tenantId: ctx.tenantId, active: true },
          select: { id: true },
        });
        if (!procedure) return { ok: false, message: 'Procedimento não encontrado.' };
      }

      return { ok: true };
    });
  }
}

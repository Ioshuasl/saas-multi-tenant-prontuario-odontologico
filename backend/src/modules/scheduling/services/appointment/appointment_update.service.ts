import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { getWorkingWindows } from '../../../clinic/clinic_public.js';
import {
  AppointmentNotFoundError,
  OutsideWorkingHoursError,
  SlotUnavailableError,
} from '../../models/errors/scheduling.errors.js';
import {
  AssertRefsRepository,
  GetAppointmentRepository,
  GetProcedureMinutesRepository,
  GetTenantTimezoneRepository,
  ListBusyIntervalsRepository,
  UpdateAppointmentRepository,
} from '../../repositories/appointment/appointment.repository.js';
import type { AppointmentUpdateSchema } from '../../schemas/scheduling.schema.js';
import type { AppointmentSummary } from '../../types/scheduling.types.js';
import {
  formatYmdInTz,
  overlaps,
  splitWindow,
} from '../../helpers/scheduling.helper.js';

function isExclusionViolation(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const message = String((err as { message?: string }).message ?? '');
  const code = String((err as { code?: string }).code ?? '');
  return code === 'P2010' || message.includes('23P01') || message.includes('exclusion');
}

export class UpdateService {
  constructor(
    private readonly get = new GetAppointmentRepository(),
    private readonly getProcedureMinutes = new GetProcedureMinutesRepository(),
    private readonly getTimezone = new GetTenantTimezoneRepository(),
    private readonly assertRefs = new AssertRefsRepository(),
    private readonly listBusy = new ListBusyIntervalsRepository(),
    private readonly update = new UpdateAppointmentRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    appointmentId: string,
    appointmentSchema: AppointmentUpdateSchema,
  ): Promise<AppointmentSummary> {
    const current = await this.get.execute(ctx, appointmentId);
    if (!current) throw new AppointmentNotFoundError();
    if (current.status === 'CANCELLED' || current.status === 'COMPLETED') {
      throw new AppError(
        'BUSINESS_RULE_VIOLATION',
        'Agendamento terminal não pode ser reagendado.',
        422,
      );
    }

    const professionalId = appointmentSchema.professionalId ?? current.professionalId;
    const chairId =
      appointmentSchema.chairId !== undefined ? appointmentSchema.chairId : current.chairId;
    const procedureId =
      appointmentSchema.procedureId !== undefined
        ? appointmentSchema.procedureId
        : current.procedureId;
    const startsAt = appointmentSchema.startsAt
      ? new Date(appointmentSchema.startsAt)
      : new Date(current.startsAt);
    let endsAt: Date;
    if (appointmentSchema.endsAt) {
      endsAt = new Date(appointmentSchema.endsAt);
    } else if (appointmentSchema.startsAt && procedureId) {
      const minutes = await this.getProcedureMinutes.execute(ctx, procedureId);
      endsAt = new Date(startsAt.getTime() + (minutes ?? 30) * 60_000);
    } else if (appointmentSchema.startsAt) {
      const duration =
        new Date(current.endsAt).getTime() - new Date(current.startsAt).getTime();
      endsAt = new Date(startsAt.getTime() + duration);
    } else {
      endsAt = new Date(current.endsAt);
    }

    if (!(endsAt > startsAt)) {
      throw new AppError('VALIDATION_ERROR', 'endsAt deve ser após startsAt.', 400);
    }

    const refs = await this.assertRefs.execute(ctx, {
      unitId: current.unitId,
      patientId: current.patientId,
      professionalId,
      chairId,
      procedureId,
    });
    if (!refs.ok) {
      throw new AppError('VALIDATION_ERROR', refs.message, 400);
    }

    const timezone = await this.getTimezone.execute(ctx);
    const dateYmd = formatYmdInTz(startsAt, timezone);
    const windows = await getWorkingWindows({
      tenantId: ctx.tenantId,
      unitId: current.unitId,
      professionalId,
      date: dateYmd,
    });
    const inside = windows.some((w) => startsAt >= w.startsAt && endsAt <= w.endsAt);
    if (!inside) throw new OutsideWorkingHoursError();

    const dayStart = windows[0]?.startsAt ?? startsAt;
    const dayEnd = windows[windows.length - 1]?.endsAt ?? endsAt;
    const busy = await this.listBusy.execute(ctx, {
      unitId: current.unitId,
      professionalId,
      from: dayStart,
      to: dayEnd,
      excludeAppointmentId: appointmentId,
    });
    const conflict = busy.find(
      (b) => b.kind === 'BOOKED' && overlaps(startsAt, endsAt, b.startsAt, b.endsAt),
    );
    if (conflict) {
      const suggested: string[] = [];
      const durationMs = endsAt.getTime() - startsAt.getTime();
      for (const w of windows) {
        for (const slot of splitWindow(w.startsAt, w.endsAt, durationMs, 15 * 60_000)) {
          if (!busy.some((b) => overlaps(slot.startsAt, slot.endsAt, b.startsAt, b.endsAt))) {
            suggested.push(slot.startsAt.toISOString());
            if (suggested.length >= 3) break;
          }
        }
        if (suggested.length >= 3) break;
      }
      throw new SlotUnavailableError({
        conflictingAppointmentId: conflict.id,
        suggestedSlots: suggested,
      });
    }

    try {
      const updated = await this.update.execute(
        ctx,
        appointmentId,
        {
          professionalId,
          chairId,
          procedureId,
          startsAt,
          endsAt,
          notes:
            appointmentSchema.notes !== undefined ? appointmentSchema.notes : undefined,
        },
        {
          action: 'RESCHEDULED',
          fromValue: {
            startsAt: current.startsAt,
            endsAt: current.endsAt,
            professionalId: current.professionalId,
            chairId: current.chairId,
          },
          toValue: {
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
            professionalId,
            chairId,
          },
        },
      );
      if (!updated) throw new AppointmentNotFoundError();
      return updated;
    } catch (err) {
      if (err instanceof SlotUnavailableError || err instanceof AppointmentNotFoundError) {
        throw err;
      }
      if (isExclusionViolation(err)) {
        throw new SlotUnavailableError({ suggestedSlots: [] });
      }
      throw err;
    }
  }
}

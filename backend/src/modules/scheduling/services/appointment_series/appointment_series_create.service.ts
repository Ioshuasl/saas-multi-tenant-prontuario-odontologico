import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { getWorkingWindows } from '../../../clinic/clinic_public.js';
import {
  OutsideWorkingHoursError,
  SlotUnavailableError,
} from '../../models/errors/scheduling.errors.js';
import { expandOccurrences } from '../../helpers/rrule.helper.js';
import { formatYmdInTz, overlaps } from '../../helpers/scheduling.helper.js';
import {
  AssertRefsRepository,
  GetDefaultUnitRepository,
  GetProcedureMinutesRepository,
  GetTenantTimezoneRepository,
  ListBusyIntervalsRepository,
} from '../../repositories/appointment/appointment.repository.js';
import { CreateSeriesRepository } from '../../repositories/appointment_series/appointment_series.repository.js';
import type { AppointmentSeriesCreateSchema } from '../../schemas/scheduling.schema.js';
import type { AppointmentSeriesSummary } from '../../types/scheduling.types.js';

const MAX_FUTURE_OCCURRENCES = 12;

function isExclusionViolation(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const message = String((err as { message?: string }).message ?? '');
  const code = String((err as { code?: string }).code ?? '');
  return code === 'P2010' || message.includes('23P01') || message.includes('exclusion');
}

export class CreateService {
  constructor(
    private readonly getDefaultUnit = new GetDefaultUnitRepository(),
    private readonly getProcedureMinutes = new GetProcedureMinutesRepository(),
    private readonly getTimezone = new GetTenantTimezoneRepository(),
    private readonly assertRefs = new AssertRefsRepository(),
    private readonly listBusy = new ListBusyIntervalsRepository(),
    private readonly create = new CreateSeriesRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    seriesSchema: AppointmentSeriesCreateSchema,
  ): Promise<AppointmentSeriesSummary> {
    const unitId = seriesSchema.unitId ?? (await this.getDefaultUnit.execute(ctx));
    if (!unitId) {
      throw new AppError('VALIDATION_ERROR', 'Unidade padrão não encontrada.', 400);
    }

    const refs = await this.assertRefs.execute(ctx, {
      unitId,
      patientId: seriesSchema.patientId,
      professionalId: seriesSchema.professionalId,
      chairId: seriesSchema.chairId,
      procedureId: seriesSchema.procedureId,
    });
    if (!refs.ok) {
      throw new AppError('VALIDATION_ERROR', refs.message, 400);
    }

    let durationMinutes = seriesSchema.durationMinutes ?? 30;
    if (seriesSchema.procedureId && !seriesSchema.durationMinutes) {
      const minutes = await this.getProcedureMinutes.execute(ctx, seriesSchema.procedureId);
      if (minutes) durationMinutes = minutes;
    }

    const startsAt = new Date(seriesSchema.startsAt);
    const occurrences = expandOccurrences(startsAt, seriesSchema.rrule, MAX_FUTURE_OCCURRENCES);
    const timezone = await this.getTimezone.execute(ctx);

    for (const start of occurrences) {
      const end = new Date(start.getTime() + durationMinutes * 60_000);
      const dateYmd = formatYmdInTz(start, timezone);
      const windows = await getWorkingWindows({
        tenantId: ctx.tenantId,
        unitId,
        professionalId: seriesSchema.professionalId,
        date: dateYmd,
      });
      const inside = windows.some((w) => start >= w.startsAt && end <= w.endsAt);
      if (!inside) {
        throw new OutsideWorkingHoursError();
      }

      const dayStart = windows[0]?.startsAt ?? start;
      const dayEnd = windows[windows.length - 1]?.endsAt ?? end;
      const busy = await this.listBusy.execute(ctx, {
        unitId,
        professionalId: seriesSchema.professionalId,
        from: dayStart,
        to: dayEnd,
      });
      const conflict = busy.find(
        (b) => b.kind === 'BOOKED' && overlaps(start, end, b.startsAt, b.endsAt),
      );
      if (conflict) {
        throw new SlotUnavailableError({
          conflictingAppointmentId: conflict.id,
          suggestedSlots: [],
        });
      }
    }

    try {
      return await this.create.execute(ctx, {
        unitId,
        patientId: seriesSchema.patientId,
        professionalId: seriesSchema.professionalId,
        chairId: seriesSchema.chairId,
        procedureId: seriesSchema.procedureId,
        rrule: seriesSchema.rrule,
        startsAt,
        durationMinutes,
        notes: seriesSchema.notes,
        occurrences,
      });
    } catch (err) {
      if (isExclusionViolation(err)) {
        throw new SlotUnavailableError({ suggestedSlots: [] });
      }
      throw err;
    }
  }
}

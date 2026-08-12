import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { getWorkingWindows } from '../../../clinic/clinic_public.js';
import {
  GetDefaultUnitRepository,
  GetProcedureMinutesRepository,
  GetTenantTimezoneRepository,
  ListBusyIntervalsRepository,
} from '../../repositories/appointment/appointment.repository.js';
import type { AvailabilityQuerySchema } from '../../schemas/scheduling.schema.js';
import type { AvailabilityResult } from '../../types/scheduling.types.js';
import { overlaps, splitWindow } from '../../helpers/scheduling.helper.js';

export class AvailabilityService {
  constructor(
    private readonly getDefaultUnit = new GetDefaultUnitRepository(),
    private readonly getProcedureMinutes = new GetProcedureMinutesRepository(),
    private readonly getTimezone = new GetTenantTimezoneRepository(),
    private readonly listBusy = new ListBusyIntervalsRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    query: AvailabilityQuerySchema,
  ): Promise<AvailabilityResult> {
    const unitId = query.unitId ?? (await this.getDefaultUnit.execute(ctx));
    if (!unitId) {
      throw new AppError('VALIDATION_ERROR', 'Unidade padrão não encontrada.', 400);
    }

    let slotMinutes = query.durationMinutes ?? 30;
    if (query.procedureId) {
      const minutes = await this.getProcedureMinutes.execute(ctx, query.procedureId);
      if (minutes) slotMinutes = minutes;
    }
    const granularity = query.granularityMinutes ?? 15;
    const timezone = await this.getTimezone.execute(ctx);

    const windows = await getWorkingWindows({
      tenantId: ctx.tenantId,
      unitId,
      professionalId: query.professionalId,
      date: query.date,
    });

    const dayStart =
      windows.length > 0
        ? new Date(Math.min(...windows.map((w) => w.startsAt.getTime())))
        : new Date(`${query.date}T00:00:00.000Z`);
    const dayEnd =
      windows.length > 0
        ? new Date(Math.max(...windows.map((w) => w.endsAt.getTime())))
        : new Date(`${query.date}T23:59:59.999Z`);

    const busy = await this.listBusy.execute(ctx, {
      unitId,
      professionalId: query.professionalId,
      from: dayStart,
      to: dayEnd,
    });

    const durationMs = slotMinutes * 60_000;
    const stepMs = granularity * 60_000;
    const slots = [];

    for (const w of windows) {
      for (const slot of splitWindow(w.startsAt, w.endsAt, durationMs, stepMs)) {
        const booked = busy.find(
          (b) =>
            b.kind === 'BOOKED' &&
            overlaps(slot.startsAt, slot.endsAt, b.startsAt, b.endsAt),
        );
        const blocked = busy.find(
          (b) =>
            b.kind === 'BLOCKED' &&
            overlaps(slot.startsAt, slot.endsAt, b.startsAt, b.endsAt),
        );
        slots.push({
          startsAt: slot.startsAt.toISOString(),
          endsAt: slot.endsAt.toISOString(),
          available: !booked && !blocked,
          ...(booked ? { reason: 'BOOKED' as const } : {}),
          ...(blocked && !booked ? { reason: 'BLOCKED' as const } : {}),
        });
      }
    }

    return {
      date: query.date,
      timezone,
      slotMinutes,
      slots,
    };
  }
}

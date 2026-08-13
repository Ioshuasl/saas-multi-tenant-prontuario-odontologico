import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { appendOutboxEvent } from '../../../../shared/database/outbox.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { getWorkingWindows } from '../../../clinic/clinic_public.js';
import {
  OutsideWorkingHoursError,
  SlotUnavailableError,
} from '../../models/errors/scheduling.errors.js';
import {
  AssertRefsRepository,
  CreateAppointmentRepository,
  FindByIdempotencyRepository,
  GetDefaultUnitRepository,
  GetProcedureMinutesRepository,
  GetTenantTimezoneRepository,
  ListBusyIntervalsRepository,
} from '../../repositories/appointment/appointment.repository.js';
import type { AppointmentCreateSchema } from '../../schemas/scheduling.schema.js';
import type { AppointmentSummary } from '../../types/scheduling.types.js';

export type AppointmentCreateOptions = {
  origin?: string;
  status?: string;
  actorType?: string;
};
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

export class CreateService {
  constructor(
    private readonly findIdempotency = new FindByIdempotencyRepository(),
    private readonly getDefaultUnit = new GetDefaultUnitRepository(),
    private readonly getProcedureMinutes = new GetProcedureMinutesRepository(),
    private readonly getTimezone = new GetTenantTimezoneRepository(),
    private readonly assertRefs = new AssertRefsRepository(),
    private readonly listBusy = new ListBusyIntervalsRepository(),
    private readonly create = new CreateAppointmentRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    appointmentSchema: AppointmentCreateSchema,
    idempotencyKey?: string | null,
    options?: AppointmentCreateOptions,
  ): Promise<AppointmentSummary> {
    if (idempotencyKey) {
      const existing = await this.findIdempotency.execute(ctx, idempotencyKey);
      if (existing) return existing;
    }

    const unitId = appointmentSchema.unitId ?? (await this.getDefaultUnit.execute(ctx));
    if (!unitId) {
      throw new AppError('VALIDATION_ERROR', 'Unidade padrão não encontrada.', 400);
    }

    const refs = await this.assertRefs.execute(ctx, {
      unitId,
      patientId: appointmentSchema.patientId,
      professionalId: appointmentSchema.professionalId,
      chairId: appointmentSchema.chairId,
      procedureId: appointmentSchema.procedureId,
    });
    if (!refs.ok) {
      throw new AppError('VALIDATION_ERROR', refs.message, 400);
    }

    const startsAt = new Date(appointmentSchema.startsAt);
    let endsAt: Date;
    if (appointmentSchema.endsAt) {
      endsAt = new Date(appointmentSchema.endsAt);
    } else if (appointmentSchema.procedureId) {
      const minutes = await this.getProcedureMinutes.execute(
        ctx,
        appointmentSchema.procedureId,
      );
      endsAt = new Date(startsAt.getTime() + (minutes ?? 30) * 60_000);
    } else {
      endsAt = new Date(startsAt.getTime() + 30 * 60_000);
    }

    if (!(endsAt > startsAt)) {
      throw new AppError('VALIDATION_ERROR', 'endsAt deve ser após startsAt.', 400);
    }

    const timezone = await this.getTimezone.execute(ctx);
    const dateYmd = formatYmdInTz(startsAt, timezone);
    const windows = await getWorkingWindows({
      tenantId: ctx.tenantId,
      unitId,
      professionalId: appointmentSchema.professionalId,
      date: dateYmd,
    });
    const inside = windows.some((w) => startsAt >= w.startsAt && endsAt <= w.endsAt);
    if (!inside) {
      throw new OutsideWorkingHoursError();
    }

    const dayStart = windows[0]?.startsAt ?? startsAt;
    const dayEnd = windows[windows.length - 1]?.endsAt ?? endsAt;
    const busy = await this.listBusy.execute(ctx, {
      unitId,
      professionalId: appointmentSchema.professionalId,
      from: dayStart,
      to: dayEnd,
    });
    const conflict = busy.find(
      (b) => b.kind === 'BOOKED' && overlaps(startsAt, endsAt, b.startsAt, b.endsAt),
    );
    if (conflict) {
      const suggested = await this.suggestSlots(
        ctx,
        unitId,
        appointmentSchema.professionalId,
        dateYmd,
        endsAt.getTime() - startsAt.getTime(),
        busy,
        windows,
      );
      throw new SlotUnavailableError({
        conflictingAppointmentId: conflict.id,
        suggestedSlots: suggested,
      });
    }

    try {
      const created = await this.create.execute(ctx, {
        unitId,
        patientId: appointmentSchema.patientId,
        professionalId: appointmentSchema.professionalId,
        chairId: appointmentSchema.chairId,
        procedureId: appointmentSchema.procedureId,
        startsAt,
        endsAt,
        status: options?.status ?? 'SCHEDULED',
        origin: options?.origin ?? 'INTERNAL',
        actorType: options?.actorType,
        notes: appointmentSchema.notes,
        idempotencyKey: idempotencyKey ?? null,
      });
      if (created.status === 'SCHEDULED') {
        await getTenantPrisma().runInTenantContext(ctx, async (tx) => {
          await appendOutboxEvent(tx, {
            tenantId: ctx.tenantId,
            event: {
              name: 'scheduling.appointment_scheduled',
              payload: { appointmentId: created.id, requestId: ctx.requestId },
            },
          });
        });
      }
      return created;
    } catch (err) {
      if (isExclusionViolation(err)) {
        const suggested = await this.suggestSlots(
          ctx,
          unitId,
          appointmentSchema.professionalId,
          dateYmd,
          endsAt.getTime() - startsAt.getTime(),
          busy,
          windows,
        );
        throw new SlotUnavailableError({ suggestedSlots: suggested });
      }
      throw err;
    }
  }

  private async suggestSlots(
    ctx: RequestContext,
    unitId: string,
    professionalId: string,
    dateYmd: string,
    durationMs: number,
    busy: Array<{ startsAt: Date; endsAt: Date }>,
    windows: Array<{ startsAt: Date; endsAt: Date }>,
  ): Promise<string[]> {
    const stepMs = 15 * 60_000;
    const suggestions: string[] = [];
    for (const w of windows) {
      for (const slot of splitWindow(w.startsAt, w.endsAt, durationMs, stepMs)) {
        const hit = busy.some((b) =>
          overlaps(slot.startsAt, slot.endsAt, b.startsAt, b.endsAt),
        );
        if (!hit) {
          suggestions.push(slot.startsAt.toISOString());
          if (suggestions.length >= 3) return suggestions;
        }
      }
    }
    void ctx;
    void unitId;
    void professionalId;
    void dateYmd;
    return suggestions;
  }
}

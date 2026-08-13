import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { appendOutboxEvent } from '../../../../shared/database/outbox.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { AppointmentStatus } from '../../enum/appointment/appointment.enum.js';
import {
  AppointmentNotFoundError,
  CancelReasonRequiredError,
  NoShowTooEarlyError,
} from '../../models/errors/scheduling.errors.js';
import { assertTransition } from '../../models/appointment/status_machine.js';
import {
  GetAppointmentRepository,
  UpdateAppointmentRepository,
} from '../../repositories/appointment/appointment.repository.js';
import type { AppointmentStatusSchema } from '../../schemas/scheduling.schema.js';
import type { AppointmentSummary } from '../../types/scheduling.types.js';

export class StatusService {
  constructor(
    private readonly get = new GetAppointmentRepository(),
    private readonly update = new UpdateAppointmentRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    appointmentId: string,
    statusSchema: AppointmentStatusSchema,
    options?: { actorType?: string },
  ): Promise<AppointmentSummary> {
    const current = await this.get.execute(ctx, appointmentId);
    if (!current) throw new AppointmentNotFoundError();

    const from = current.status as AppointmentStatus;
    const to = statusSchema.status;
    assertTransition(from, to);

    if (to === 'CANCELLED' && !statusSchema.reason?.trim()) {
      throw new CancelReasonRequiredError();
    }

    if (to === 'NO_SHOW' && new Date() < new Date(current.startsAt)) {
      throw new NoShowTooEarlyError();
    }

    const patch: {
      status: string;
      confirmedAt?: Date | null;
      arrivedAt?: Date | null;
      cancelledAt?: Date | null;
      cancelReason?: string | null;
    } = { status: to };

    if (to === 'CONFIRMED') patch.confirmedAt = new Date();
    if (to === 'IN_SERVICE') patch.arrivedAt = new Date();
    if (to === 'CANCELLED') {
      patch.cancelledAt = new Date();
      patch.cancelReason = statusSchema.reason!.trim();
    }
    if (to === 'SCHEDULED' && from === 'NO_SHOW') {
      patch.cancelReason = null;
      patch.cancelledAt = null;
    }

    const updated = await this.update.execute(
      ctx,
      appointmentId,
      patch,
      {
        action: to === 'CANCELLED' ? 'CANCELLED' : 'STATUS_CHANGED',
        fromValue: { status: from },
        toValue: { status: to, reason: statusSchema.reason ?? null },
        actorType: options?.actorType,
      },
    );
    if (!updated) throw new AppointmentNotFoundError();

    if (to === 'CANCELLED' || to === 'NO_SHOW' || to === 'CONFIRMED' || (to === 'SCHEDULED' && from === 'REQUESTED')) {
      await getTenantPrisma().runInTenantContext(ctx, async (tx) => {
        const name =
          to === 'NO_SHOW'
            ? 'scheduling.appointment_no_show'
            : to === 'CANCELLED'
              ? 'scheduling.appointment_cancelled'
              : to === 'CONFIRMED'
                ? 'scheduling.appointment_confirmed'
                : 'scheduling.appointment_scheduled';
        await appendOutboxEvent(tx, {
          tenantId: ctx.tenantId,
          event: {
            name,
            payload: { appointmentId: updated.id, requestId: ctx.requestId },
          },
        });
      });
    }

    return updated;
  }
}

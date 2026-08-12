import type { RequestContext } from '../../../../shared/domain/request_context.js';
import {
  AppointmentNotFoundError,
  CancelReasonRequiredError,
} from '../../models/errors/scheduling.errors.js';
import { assertTransition } from '../../models/appointment/status_machine.js';
import type { AppointmentStatus } from '../../enum/appointment/appointment.enum.js';
import {
  GetAppointmentRepository,
  UpdateAppointmentRepository,
} from '../../repositories/appointment/appointment.repository.js';
import type { AppointmentSummary } from '../../types/scheduling.types.js';

export class DeleteService {
  constructor(
    private readonly get = new GetAppointmentRepository(),
    private readonly update = new UpdateAppointmentRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    appointmentId: string,
    reason: string,
  ): Promise<AppointmentSummary> {
    if (!reason.trim()) throw new CancelReasonRequiredError();

    const current = await this.get.execute(ctx, appointmentId);
    if (!current) throw new AppointmentNotFoundError();

    const from = current.status as AppointmentStatus;
    if (from !== 'CANCELLED') {
      assertTransition(from, 'CANCELLED');
    } else {
      return current;
    }

    const updated = await this.update.execute(
      ctx,
      appointmentId,
      {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason.trim(),
      },
      {
        action: 'CANCELLED',
        fromValue: { status: from },
        toValue: { status: 'CANCELLED', reason: reason.trim() },
      },
    );
    if (!updated) throw new AppointmentNotFoundError();
    return updated;
  }
}

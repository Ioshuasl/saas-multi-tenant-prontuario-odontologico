import type { RequestContext } from '../../../../shared/domain/request_context.js';
import {
  AppointmentNotFoundError,
  CancelReasonRequiredError,
} from '../../models/errors/scheduling.errors.js';
import { GetAppointmentRepository } from '../../repositories/appointment/appointment.repository.js';
import type { AppointmentSummary } from '../../types/scheduling.types.js';
import { StatusService } from './appointment_status.service.js';

export class DeleteService {
  constructor(
    private readonly get = new GetAppointmentRepository(),
    private readonly appointmentStatus = new StatusService(),
  ) {}

  async execute(
    ctx: RequestContext,
    appointmentId: string,
    reason: string,
  ): Promise<AppointmentSummary> {
    if (!reason.trim()) throw new CancelReasonRequiredError();

    const current = await this.get.execute(ctx, appointmentId);
    if (!current) throw new AppointmentNotFoundError();
    if (current.status === 'CANCELLED') return current;

    return this.appointmentStatus.execute(ctx, appointmentId, {
      status: 'CANCELLED',
      reason: reason.trim(),
    });
  }
}

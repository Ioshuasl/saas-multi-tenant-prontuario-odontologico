import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { GetAppointmentRepository } from '../../repositories/appointment/appointment.repository.js';
import type { AppointmentSummary } from '../../types/scheduling.types.js';

export class GetService {
  constructor(private readonly get = new GetAppointmentRepository()) {}

  async execute(
    ctx: RequestContext,
    appointmentId: string,
  ): Promise<AppointmentSummary | null> {
    return this.get.execute(ctx, appointmentId);
  }
}

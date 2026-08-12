import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppointmentNotFoundError } from '../../models/errors/scheduling.errors.js';
import {
  GetAppointmentRepository,
  ListHistoryRepository,
} from '../../repositories/appointment/appointment.repository.js';
import type { AppointmentHistoryItem } from '../../types/scheduling.types.js';

export class HistoryService {
  constructor(
    private readonly get = new GetAppointmentRepository(),
    private readonly list = new ListHistoryRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    appointmentId: string,
  ): Promise<AppointmentHistoryItem[]> {
    const current = await this.get.execute(ctx, appointmentId);
    if (!current) throw new AppointmentNotFoundError();
    return this.list.execute(ctx, appointmentId);
  }
}

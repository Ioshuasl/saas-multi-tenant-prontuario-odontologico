import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ListAppointmentsRepository } from '../../repositories/appointment/appointment.repository.js';
import type { AppointmentListQuerySchema } from '../../schemas/scheduling.schema.js';
import type { AppointmentSummary } from '../../types/scheduling.types.js';

export class ListService {
  constructor(private readonly list = new ListAppointmentsRepository()) {}

  async execute(
    ctx: RequestContext,
    query: AppointmentListQuerySchema,
  ): Promise<AppointmentSummary[]> {
    return this.list.execute(ctx, {
      unitId: query.unitId,
      professionalId: query.professionalId,
      chairId: query.chairId,
      patientId: query.patientId,
      status: query.status,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });
  }
}

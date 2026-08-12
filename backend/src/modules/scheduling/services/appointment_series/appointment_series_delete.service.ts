import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { AppointmentSeriesNotFoundError } from '../../models/errors/scheduling.errors.js';
import {
  CancelSeriesAppointmentsRepository,
  GetSeriesRepository,
} from '../../repositories/appointment_series/appointment_series.repository.js';
import type { AppointmentSeriesDeleteQuerySchema } from '../../schemas/scheduling.schema.js';

export class DeleteService {
  constructor(
    private readonly getSeries = new GetSeriesRepository(),
    private readonly cancel = new CancelSeriesAppointmentsRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    seriesId: string,
    query: AppointmentSeriesDeleteQuerySchema,
  ): Promise<{ seriesId: string; scope: string; cancelledCount: number }> {
    const series = await this.getSeries.execute(ctx, seriesId);
    if (!series) throw new AppointmentSeriesNotFoundError();

    const reason = query.reason?.trim() || `Exclusão de série (${query.scope})`;
    const active = series.appointments.filter((a) => a.status !== 'CANCELLED');

    let targets: string[] = [];

    if (query.scope === 'ALL') {
      targets = active.map((a) => a.id);
    } else {
      const pivot = active.find((a) => a.id === query.appointmentId);
      if (!pivot) {
        throw new AppError(
          'VALIDATION_ERROR',
          'appointmentId não pertence a esta série ou já está cancelado.',
          400,
        );
      }
      if (query.scope === 'THIS') {
        targets = [pivot.id];
      } else {
        targets = active
          .filter((a) => a.startsAt.getTime() >= pivot.startsAt.getTime())
          .map((a) => a.id);
      }
    }

    const cancelledCount = await this.cancel.execute(ctx, {
      seriesId,
      appointmentIds: targets,
      reason,
      unlink: query.scope === 'THIS',
    });

    return { seriesId, scope: query.scope, cancelledCount };
  }
}

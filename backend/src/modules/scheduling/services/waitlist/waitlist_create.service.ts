import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { getPatientById } from '../../../patients/patients_public.js';
import { CreateRepository } from '../../repositories/waitlist/waitlist_create.repository.js';
import type { WaitlistCreateSchema } from '../../schemas/waitlist.schema.js';

export class CreateService {
  constructor(private readonly create = new CreateRepository()) {}

  async execute(ctx: RequestContext, waitlistSchema: WaitlistCreateSchema) {
    const patient = await getPatientById(ctx, waitlistSchema.patientId);
    if (!patient || !patient.active) {
      throw new AppError('VALIDATION_ERROR', 'Paciente não encontrado.', 400);
    }

    return this.create.execute(ctx, {
      unitId: patient.unitId,
      patientId: waitlistSchema.patientId,
      professionalId: waitlistSchema.professionalId,
      procedureId: waitlistSchema.procedureId,
      preferredPeriods: waitlistSchema.preferredPeriods,
      priority: waitlistSchema.priority,
    });
  }
}

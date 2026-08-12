import type { RequestContext } from '../../../../shared/domain/request_context.js';
import {
  ConfirmFutureAppointmentsError,
  PatientNotFoundError,
} from '../../models/errors/patients.errors.js';
import {
  DeactivatePatientRepository,
  ListFutureAppointmentsRepository,
} from '../../repositories/patient/patient.repository.js';
import type { PatientSummary } from '../../types/patients.types.js';

export class DeleteService {
  constructor(
    private readonly listFuture = new ListFutureAppointmentsRepository(),
    private readonly deactivate = new DeactivatePatientRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    confirmFutureAppointments: boolean,
  ): Promise<PatientSummary> {
    const futureIds = await this.listFuture.execute(ctx, patientId);
    if (futureIds.length > 0 && !confirmFutureAppointments) {
      throw new ConfirmFutureAppointmentsError(futureIds.length);
    }

    const result = await this.deactivate.execute(ctx, patientId);
    if (!result) throw new PatientNotFoundError();
    return result;
  }
}

import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { PatientNotFoundError } from '../../models/errors/patients.errors.js';
import {
  GetPatientRepository,
  ListConsentsRepository,
} from '../../repositories/patient/patient.repository.js';
import type { ConsentSummary } from '../../types/patients.types.js';

export class ListService {
  constructor(
    private readonly getPatient = new GetPatientRepository(),
    private readonly list = new ListConsentsRepository(),
  ) {}

  async execute(ctx: RequestContext, patientId: string): Promise<ConsentSummary[]> {
    const patient = await this.getPatient.execute(ctx, patientId);
    if (!patient) throw new PatientNotFoundError();
    return this.list.execute(ctx, patientId);
  }
}

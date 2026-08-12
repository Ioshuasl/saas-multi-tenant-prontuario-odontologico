import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { GetPatientRepository } from '../../repositories/patient/patient.repository.js';
import { isMinor } from '../../helpers/patient.helper.js';
import type { PatientDetail, PatientWarning } from '../../types/patients.types.js';

export class GetService {
  constructor(private readonly get = new GetPatientRepository()) {}

  async execute(ctx: RequestContext, patientId: string): Promise<PatientDetail | null> {
    const patient = await this.get.execute(ctx, patientId);
    if (!patient) return null;

    const warnings: PatientWarning[] = [];
    if (isMinor(patient.birthDate) && patient.guardians.length === 0) {
      warnings.push('MINOR_WITHOUT_GUARDIAN');
    }
    return { ...patient, warnings };
  }
}

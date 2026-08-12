import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { PatientNotFoundError } from '../../models/errors/patients.errors.js';
import {
  CreateGuardianRepository,
  GetPatientRepository,
} from '../../repositories/patient/patient.repository.js';
import {
  isValidCpf,
  normalizeCpf,
  normalizePhone,
} from '../../helpers/patient.helper.js';
import type { GuardianCreateSchema } from '../../schemas/patients.schema.js';
import type { LegalGuardianSummary } from '../../types/patients.types.js';

export class CreateService {
  constructor(
    private readonly getPatient = new GetPatientRepository(),
    private readonly create = new CreateGuardianRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    guardianSchema: GuardianCreateSchema,
  ): Promise<LegalGuardianSummary> {
    const patient = await this.getPatient.execute(ctx, patientId);
    if (!patient) throw new PatientNotFoundError();

    return this.create.execute(ctx, patientId, {
      name: guardianSchema.name.trim(),
      cpf:
        guardianSchema.cpf && isValidCpf(guardianSchema.cpf)
          ? normalizeCpf(guardianSchema.cpf)
          : null,
      relationship: guardianSchema.relationship ?? null,
      phone: guardianSchema.phone ? normalizePhone(guardianSchema.phone) : null,
      email: guardianSchema.email ?? null,
    });
  }
}

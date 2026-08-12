import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { PatientNotFoundError } from '../../models/errors/patients.errors.js';
import {
  CreateConsentRepository,
  GetPatientRepository,
} from '../../repositories/patient/patient.repository.js';
import type { ConsentCreateSchema } from '../../schemas/patients.schema.js';
import type { ConsentSummary } from '../../types/patients.types.js';

export class CreateService {
  constructor(
    private readonly getPatient = new GetPatientRepository(),
    private readonly create = new CreateConsentRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    consentSchema: ConsentCreateSchema,
    meta?: { ipAddress?: string | null; userAgent?: string | null },
  ): Promise<ConsentSummary> {
    const patient = await this.getPatient.execute(ctx, patientId);
    if (!patient) throw new PatientNotFoundError();

    return this.create.execute(ctx, patientId, {
      type: consentSchema.type,
      granted: consentSchema.granted,
      documentVersion: consentSchema.documentVersion,
      channel: consentSchema.channel,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }
}

import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { MedicalRecordNotFoundError } from '../../models/errors/clinical_records.errors.js';
import { GetIdRepository } from '../../repositories/medical_record/medical_record_get_id.repository.js';
import { ListRepository } from '../../repositories/tooth_state/tooth_state_list.repository.js';
import type { OdontogramGetQuerySchema } from '../../schemas/odontogram.schema.js';
import type { OdontogramGetResult } from '../../types/odontogram/odontogram_get.types.js';

export class GetService {
  constructor(
    private readonly getRecordId = new GetIdRepository(),
    private readonly list = new ListRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    query: OdontogramGetQuerySchema,
  ): Promise<OdontogramGetResult> {
    const medicalRecordId = await this.getRecordId.execute(ctx, patientId);
    if (!medicalRecordId) throw new MedicalRecordNotFoundError();

    const at = query.at ? new Date(query.at) : null;
    const teeth = await this.list.execute(ctx, medicalRecordId, query.dentition, at);
    return {
      patientId,
      medicalRecordId,
      dentition: query.dentition,
      at: at ? at.toISOString() : null,
      teeth,
    };
  }
}

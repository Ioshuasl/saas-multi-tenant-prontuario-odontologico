import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { MedicalRecordNotFoundError } from '../../models/errors/clinical_records.errors.js';
import { GetRepository } from '../../repositories/medical_record/medical_record_get.repository.js';
import type { MedicalRecordHeader } from '../../types/medical_record/medical_record_get.types.js';

export class GetService {
  constructor(private readonly get = new GetRepository()) {}

  async execute(ctx: RequestContext, patientId: string): Promise<MedicalRecordHeader> {
    const record = await this.get.execute(ctx, patientId);
    if (!record) throw new MedicalRecordNotFoundError();
    return record;
  }
}

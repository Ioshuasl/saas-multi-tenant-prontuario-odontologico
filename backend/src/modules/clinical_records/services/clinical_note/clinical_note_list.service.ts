import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { MedicalRecordNotFoundError } from '../../models/errors/clinical_records.errors.js';
import { GetIdRepository } from '../../repositories/medical_record/medical_record_get_id.repository.js';
import { ListRepository } from '../../repositories/clinical_note/clinical_note_list.repository.js';
import type { ClinicalNoteListQuerySchema } from '../../schemas/clinical_note.schema.js';
import type { ClinicalNoteListResult } from '../../types/clinical_note/clinical_note_list.types.js';

const DEFAULT_LIMIT = 20;

export class ListService {
  constructor(
    private readonly getRecordId = new GetIdRepository(),
    private readonly list = new ListRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    query: ClinicalNoteListQuerySchema,
  ): Promise<ClinicalNoteListResult> {
    const medicalRecordId = await this.getRecordId.execute(ctx, patientId);
    if (!medicalRecordId) throw new MedicalRecordNotFoundError();
    return this.list.execute(ctx, medicalRecordId, {
      cursor: query.cursor,
      limit: query.limit ?? DEFAULT_LIMIT,
    });
  }
}

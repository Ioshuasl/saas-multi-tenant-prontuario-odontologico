import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { CreateAction } from '../../actions/clinical_note/clinical_note_create.action.js';
import type { ClinicalNoteCreateSchema } from '../../schemas/clinical_note.schema.js';
import type { ClinicalNoteSummary } from '../../types/clinical_note/clinical_note_list.types.js';

export class CreateService {
  constructor(private readonly createAction = new CreateAction()) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    noteSchema: ClinicalNoteCreateSchema,
    extra?: { ip?: string },
  ): Promise<ClinicalNoteSummary> {
    return this.createAction.execute(ctx, patientId, noteSchema, extra);
  }
}

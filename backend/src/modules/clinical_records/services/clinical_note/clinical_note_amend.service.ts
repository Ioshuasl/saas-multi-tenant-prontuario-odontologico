import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AmendAction } from '../../actions/clinical_note/clinical_note_amend.action.js';
import type { ClinicalNoteAmendSchema } from '../../schemas/clinical_note.schema.js';
import type { ClinicalNoteSummary } from '../../types/clinical_note/clinical_note_list.types.js';

export class AmendService {
  constructor(private readonly amendAction = new AmendAction()) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    noteId: string,
    amendSchema: ClinicalNoteAmendSchema,
    extra?: { ip?: string },
  ): Promise<ClinicalNoteSummary> {
    return this.amendAction.execute(ctx, patientId, noteId, amendSchema, extra);
  }
}

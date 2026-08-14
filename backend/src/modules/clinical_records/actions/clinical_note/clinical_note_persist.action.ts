import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { appendOutboxEvents } from '../../../../shared/database/outbox.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { hashToken } from '../../../../shared/helpers/token_hash.js';
import {
  ClinicalNote,
  canonicalNotePayload,
} from '../../models/clinical_note/clinical_note.model.js';
import { MedicalRecordNotFoundError } from '../../models/errors/clinical_records.errors.js';
import { GetIdRepository } from '../../repositories/medical_record/medical_record_get_id.repository.js';
import { CreateRepository } from '../../repositories/clinical_note/clinical_note_create.repository.js';
import type {
  CreateSignedNoteInput,
  CreateSignedNoteResult,
} from '../../types/clinical_note/clinical_note_signed.types.js';

export class PersistAction {
  constructor(
    private readonly getRecordId = new GetIdRepository(),
    private readonly createNote = new CreateRepository(),
  ) {}

  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    noteSchema: CreateSignedNoteInput,
  ): Promise<CreateSignedNoteResult> {
    const medicalRecordId = await this.getRecordId.executeInTx(tx, ctx, noteSchema.patientId);
    if (!medicalRecordId) throw new MedicalRecordNotFoundError();

    const professional = noteSchema.professional;
    const noteId = idGenerator.next();
    const note = ClinicalNote.create({
      id: noteId,
      medicalRecordId,
      appointmentId: noteSchema.appointmentId ?? null,
      professional,
      content: noteSchema.content,
      procedures: noteSchema.procedures ?? [],
    });
    const contentHash = hashToken(canonicalNotePayload(note.content, note.procedures));
    await this.createNote.executeInTx(tx, ctx, note, contentHash);
    await appendOutboxEvents(tx, ctx.tenantId, [
      {
        name: 'clinical_records.note_created',
        payload: {
          noteId: note.id,
          patientId: noteSchema.patientId,
          medicalRecordId,
          appointmentId: note.props.appointmentId,
          requestId: ctx.requestId,
        },
      },
    ]);
    return { id: note.id, professionalId: professional.id };
  }
}

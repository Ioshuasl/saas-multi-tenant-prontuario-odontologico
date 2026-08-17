import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { hashToken } from '../../../../shared/helpers/token_hash.js';
import { getProfessionalByMembershipId } from '../../../clinic/clinic_public.js';
import {
  ClinicalNote,
  canonicalNotePayload,
  type NoteProfessional,
} from '../../models/clinical_note/clinical_note.model.js';
import {
  ClinicalNoteNotFoundError,
  MedicalRecordNotFoundError,
  ProfessionalWithoutCroError,
} from '../../models/errors/clinical_records.errors.js';
import { GetIdRepository } from '../../repositories/medical_record/medical_record_get_id.repository.js';
import { GetRepository } from '../../repositories/clinical_note/clinical_note_get.repository.js';
import { CreateRepository } from '../../repositories/clinical_note/clinical_note_create.repository.js';
import { formatContentHash } from '../../repositories/clinical_note/mappers/clinical_note.mapper.js';
import type { ClinicalNoteAmendSchema } from '../../schemas/clinical_note.schema.js';
import type { ClinicalNoteSummary } from '../../types/clinical_note/clinical_note_list.types.js';

export class AmendAction {
  constructor(
    private readonly uow = new UnitOfWork(),
    private readonly getRecordId = new GetIdRepository(),
    private readonly getNote = new GetRepository(),
    private readonly createNote = new CreateRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    noteId: string,
    amendSchema: ClinicalNoteAmendSchema,
    extra?: { ip?: string },
  ): Promise<ClinicalNoteSummary> {
    const medicalRecordId = await this.getRecordId.execute(ctx, patientId);
    if (!medicalRecordId) throw new MedicalRecordNotFoundError();

    const existing = await this.getNote.execute(ctx, medicalRecordId, noteId);
    if (!existing) throw new ClinicalNoteNotFoundError();

    const professional = await this.resolveProfessional(ctx);
    const current = ClinicalNote.fromPersisted({
      id: existing.id,
      medicalRecordId: existing.medicalRecordId,
      appointmentId: existing.appointmentId,
      professionalId: existing.professionalId,
      content: existing.content,
      procedures: existing.procedures,
      version: existing.version,
      supersedesId: existing.supersedesId,
      amendReason: existing.amendReason,
      signedAt: new Date(existing.signedAt),
      signature: {
        type: 'SIMPLE',
        userId: existing.signature.userId,
        croNumber: existing.signature.croNumber,
        croState: existing.signature.croState,
        ip: existing.signature.ip,
      },
    });

    const nextId = idGenerator.next();
    const next = current.amend({
      id: nextId,
      reason: amendSchema.reason,
      content: amendSchema.content,
      professional,
      ip: extra?.ip,
    });
    const contentHash = hashToken(canonicalNotePayload(next.content, next.procedures));

    await this.uow.run(ctx, async ({ tx, publish }) => {
      await this.createNote.executeInTx(tx, ctx, next, contentHash);
      publish([
        {
          name: 'clinical_records.note_amended',
          payload: {
            noteId: next.id,
            supersedesId: existing.id,
            patientId,
            medicalRecordId,
            requestId: ctx.requestId,
          },
        },
      ]);
    });

    await writeAuditLogSafe({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: AuditAction.NOTE_AMENDED,
      resourceType: 'clinical_note',
      resourceId: next.id,
      patientId,
      ipAddress: extra?.ip,
      metadata: { version: next.version, supersedesId: existing.id },
    });

    return {
      id: next.id,
      appointmentId: next.props.appointmentId,
      professionalId: next.props.professionalId,
      content: next.content,
      procedures: next.procedures,
      version: next.version,
      supersedesId: next.props.supersedesId,
      amendReason: next.props.amendReason,
      contentHash: formatContentHash(contentHash),
      signedAt: next.props.signedAt.toISOString(),
      signature: next.props.signature,
      createdAt: next.props.signedAt.toISOString(),
    };
  }

  private async resolveProfessional(ctx: RequestContext): Promise<NoteProfessional> {
    if (!ctx.membershipId) throw new ProfessionalWithoutCroError();
    const professional = await getProfessionalByMembershipId(ctx, ctx.membershipId);
    if (!professional) throw new ProfessionalWithoutCroError();
    return {
      id: professional.id,
      userId: professional.userId,
      croNumber: professional.croNumber,
      croState: professional.croState,
    };
  }
}

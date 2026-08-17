import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { hashToken } from '../../../../shared/helpers/token_hash.js';
import { getProfessionalByMembershipId } from '../../../clinic/clinic_public.js';
import { getAppointmentById, startAppointment } from '../../../scheduling/scheduling_public.js';
import {
  ClinicalNote,
  canonicalNotePayload,
  type NoteProfessional,
} from '../../models/clinical_note/clinical_note.model.js';
import {
  AppointmentNotLinkableError,
  MedicalRecordNotFoundError,
  ProfessionalWithoutCroError,
} from '../../models/errors/clinical_records.errors.js';
import { GetIdRepository } from '../../repositories/medical_record/medical_record_get_id.repository.js';
import { CreateRepository } from '../../repositories/clinical_note/clinical_note_create.repository.js';
import { formatContentHash } from '../../repositories/clinical_note/mappers/clinical_note.mapper.js';
import type { ClinicalNoteCreateSchema } from '../../schemas/clinical_note.schema.js';
import type { ClinicalNoteSummary } from '../../types/clinical_note/clinical_note_list.types.js';

const LINKABLE_WITHOUT_START = new Set(['IN_SERVICE', 'COMPLETED']);
const STARTABLE = new Set(['SCHEDULED', 'CONFIRMED']);

export class CreateAction {
  constructor(
    private readonly uow = new UnitOfWork(),
    private readonly getRecordId = new GetIdRepository(),
    private readonly createNote = new CreateRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    noteSchema: ClinicalNoteCreateSchema,
    extra?: { ip?: string },
  ): Promise<ClinicalNoteSummary> {
    const medicalRecordId = await this.getRecordId.execute(ctx, patientId);
    if (!medicalRecordId) throw new MedicalRecordNotFoundError();

    const professional = await this.resolveProfessional(ctx);
    const appointmentId = noteSchema.appointmentId ?? null;
    if (appointmentId) {
      await this.linkAppointment(ctx, patientId, appointmentId);
    }

    const noteId = idGenerator.next();
    const note = ClinicalNote.create({
      id: noteId,
      medicalRecordId,
      appointmentId,
      professional,
      content: noteSchema.content,
      procedures: noteSchema.procedures ?? [],
      ip: extra?.ip,
    });
    const contentHash = hashToken(canonicalNotePayload(note.content, note.procedures));

    await this.uow.run(ctx, async ({ tx, publish }) => {
      await this.createNote.executeInTx(tx, ctx, note, contentHash);
      publish([
        {
          name: 'clinical_records.note_created',
          payload: {
            noteId: note.id,
            patientId,
            medicalRecordId,
            appointmentId,
            requestId: ctx.requestId,
          },
        },
      ]);
    });

    await writeAuditLogSafe({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: AuditAction.NOTE_CREATED,
      resourceType: 'clinical_note',
      resourceId: note.id,
      patientId,
      ipAddress: extra?.ip,
      metadata: { version: note.version, appointmentId },
    });

    return {
      id: note.id,
      appointmentId: note.props.appointmentId,
      professionalId: note.props.professionalId,
      content: note.content,
      procedures: note.procedures,
      version: note.version,
      supersedesId: note.props.supersedesId,
      amendReason: note.props.amendReason,
      contentHash: formatContentHash(contentHash),
      signedAt: note.props.signedAt.toISOString(),
      signature: note.props.signature,
      createdAt: note.props.signedAt.toISOString(),
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

  private async linkAppointment(
    ctx: RequestContext,
    patientId: string,
    appointmentId: string,
  ): Promise<void> {
    const appointment = await getAppointmentById(ctx, appointmentId);
    if (!appointment || appointment.patientId !== patientId) {
      throw new AppointmentNotLinkableError();
    }
    if (LINKABLE_WITHOUT_START.has(appointment.status)) return;
    if (STARTABLE.has(appointment.status)) {
      await startAppointment(ctx, appointmentId);
      return;
    }
    throw new AppointmentNotLinkableError();
  }
}

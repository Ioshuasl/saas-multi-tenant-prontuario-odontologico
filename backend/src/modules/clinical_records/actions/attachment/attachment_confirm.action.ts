import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { getObjectStorage, ObjectStorageError } from '../../../../shared/storage/index.js';
import { Attachment } from '../../models/attachment/attachment.model.js';
import {
  AttachmentUploadMissingError,
  ClinicalNoteNotFoundError,
  InvalidStorageKeyError,
  MedicalRecordNotFoundError,
  StorageUnavailableError,
} from '../../models/errors/clinical_records.errors.js';
import {
  storageKeyBelongsToPatient,
} from '../../helpers/attachment_storage.helper.js';
import { GetIdRepository } from '../../repositories/medical_record/medical_record_get_id.repository.js';
import { ExistsRepository } from '../../repositories/clinical_note/clinical_note_exists.repository.js';
import { GetByKeyRepository } from '../../repositories/attachment/attachment_get_by_key.repository.js';
import { CreateRepository } from '../../repositories/attachment/attachment_create.repository.js';
import type { AttachmentConfirmSchema } from '../../schemas/attachment.schema.js';
import type { AttachmentSummary } from '../../types/attachment/attachment_list.types.js';
import { mapAttachment } from '../../repositories/attachment/mappers/attachment.mapper.js';

export class ConfirmAction {
  constructor(
    private readonly uow = new UnitOfWork(),
    private readonly getRecordId = new GetIdRepository(),
    private readonly noteExists = new ExistsRepository(),
    private readonly getByKey = new GetByKeyRepository(),
    private readonly createAttachment = new CreateRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    confirmSchema: AttachmentConfirmSchema,
  ): Promise<AttachmentSummary> {
    Attachment.assertUpload({
      mimeType: confirmSchema.mimeType,
      sizeBytes: confirmSchema.sizeBytes,
      category: confirmSchema.category,
    });

    if (!storageKeyBelongsToPatient(confirmSchema.storageKey, ctx.tenantId, patientId)) {
      throw new InvalidStorageKeyError();
    }

    const existing = await this.getByKey.execute(ctx, confirmSchema.storageKey);
    if (existing) return existing;

    const medicalRecordId = await this.getRecordId.execute(ctx, patientId);
    if (!medicalRecordId) throw new MedicalRecordNotFoundError();

    const clinicalNoteId = confirmSchema.clinicalNoteId ?? null;
    if (clinicalNoteId) {
      const ok = await this.noteExists.execute(ctx, medicalRecordId, clinicalNoteId);
      if (!ok) throw new ClinicalNoteNotFoundError();
    }

    try {
      const head = await getObjectStorage().headObject(confirmSchema.storageKey);
      if (!head) throw new AttachmentUploadMissingError();
    } catch (err) {
      if (err instanceof AttachmentUploadMissingError) throw err;
      if (err instanceof ObjectStorageError) throw new StorageUnavailableError();
      throw err;
    }

    const attachment = Attachment.create({
      id: idGenerator.next(),
      patientId,
      medicalRecordId,
      clinicalNoteId,
      category: confirmSchema.category,
      fileName: confirmSchema.fileName,
      storageKey: confirmSchema.storageKey,
      mimeType: confirmSchema.mimeType,
      sizeBytes: confirmSchema.sizeBytes,
      checksumSha256: confirmSchema.checksumSha256,
      uploadedBy: ctx.userId,
    });

    await this.uow.run(ctx, async ({ tx, publish }) => {
      await this.createAttachment.executeInTx(tx, ctx, attachment);
      publish([
        {
          name: 'clinical_records.attachment_created',
          payload: {
            attachmentId: attachment.props.id,
            patientId,
            requestId: ctx.requestId,
          },
        },
      ]);
    });

    return mapAttachment({
      id: attachment.props.id,
      patientId: attachment.props.patientId,
      medicalRecordId: attachment.props.medicalRecordId,
      clinicalNoteId: attachment.props.clinicalNoteId,
      category: attachment.props.category,
      fileName: attachment.props.fileName,
      storageKey: attachment.props.storageKey,
      mimeType: attachment.props.mimeType,
      sizeBytes: BigInt(attachment.props.sizeBytes),
      checksumSha256: attachment.props.checksumSha256,
      thumbnailKey: null,
      uploadedBy: attachment.props.uploadedBy,
      createdAt: new Date(),
      deletedAt: null,
    });
  }
}

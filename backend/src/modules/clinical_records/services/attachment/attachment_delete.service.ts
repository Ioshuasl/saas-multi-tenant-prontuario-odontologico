import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { Attachment } from '../../models/attachment/attachment.model.js';
import { AttachmentNotFoundError } from '../../models/errors/clinical_records.errors.js';
import { GetRepository } from '../../repositories/attachment/attachment_get.repository.js';
import { DeleteRepository } from '../../repositories/attachment/attachment_delete.repository.js';
import type { AttachmentDeleteSchema } from '../../schemas/attachment.schema.js';
import type { AttachmentSummary } from '../../types/attachment/attachment_list.types.js';

export class DeleteService {
  constructor(
    private readonly getAttachment = new GetRepository(),
    private readonly deleteAttachment = new DeleteRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    attachmentId: string,
    deleteSchema: AttachmentDeleteSchema,
  ): Promise<AttachmentSummary> {
    const current = await this.getAttachment.execute(ctx, attachmentId);
    if (!current) throw new AttachmentNotFoundError();

    const domain = Attachment.fromPersisted({
      id: current.id,
      patientId: current.patientId,
      medicalRecordId: current.medicalRecordId,
      clinicalNoteId: current.clinicalNoteId,
      category: current.category,
      fileName: current.fileName,
      storageKey: current.storageKey,
      mimeType: current.mimeType,
      sizeBytes: current.sizeBytes,
      checksumSha256: current.checksumSha256,
      uploadedBy: current.uploadedBy,
      deletedAt: null,
      deletedReason: null,
      deletedBy: null,
    }).delete(deleteSchema.reason, ctx.userId);

    const updated = await this.deleteAttachment.execute(ctx, domain);
    if (!updated) throw new AttachmentNotFoundError();
    return updated;
  }
}

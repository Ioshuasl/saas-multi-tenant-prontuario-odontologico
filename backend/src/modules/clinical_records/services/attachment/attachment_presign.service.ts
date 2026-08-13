import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { env } from '../../../../shared/config/env.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { getObjectStorage, ObjectStorageError } from '../../../../shared/storage/index.js';
import { Attachment } from '../../models/attachment/attachment.model.js';
import {
  MedicalRecordNotFoundError,
  PlanLimitExceededError,
  StorageUnavailableError,
} from '../../models/errors/clinical_records.errors.js';
import {
  PRESIGN_TTL_SECONDS,
  buildAttachmentStorageKey,
} from '../../helpers/attachment_storage.helper.js';
import { GetIdRepository } from '../../repositories/medical_record/medical_record_get_id.repository.js';
import { UsageRepository } from '../../repositories/attachment/attachment_usage.repository.js';
import type { AttachmentPresignSchema } from '../../schemas/attachment.schema.js';
import type { AttachmentPresignResult } from '../../types/attachment/attachment_presign.types.js';

export class PresignService {
  constructor(
    private readonly getRecordId = new GetIdRepository(),
    private readonly usage = new UsageRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    attachmentSchema: AttachmentPresignSchema,
  ): Promise<AttachmentPresignResult> {
    Attachment.assertUpload({
      mimeType: attachmentSchema.mimeType,
      sizeBytes: attachmentSchema.sizeBytes,
      category: attachmentSchema.category,
    });

    const recordId = await this.getRecordId.execute(ctx, patientId);
    if (!recordId) throw new MedicalRecordNotFoundError();

    const used = await this.usage.execute(ctx);
    if (used + attachmentSchema.sizeBytes > env.ATTACHMENT_QUOTA_BYTES) {
      throw new PlanLimitExceededError();
    }

    const storageKey = buildAttachmentStorageKey({
      tenantId: ctx.tenantId,
      patientId,
      objectId: idGenerator.next(),
      fileName: attachmentSchema.fileName,
      mimeType: attachmentSchema.mimeType,
    });

    try {
      const signed = await getObjectStorage().presignPut(
        storageKey,
        attachmentSchema.mimeType,
        PRESIGN_TTL_SECONDS,
      );
      return {
        uploadUrl: signed.url,
        method: 'PUT',
        headers: signed.headers,
        storageKey,
        expiresIn: PRESIGN_TTL_SECONDS,
      };
    } catch (err) {
      if (err instanceof ObjectStorageError) throw new StorageUnavailableError();
      throw err;
    }
  }
}

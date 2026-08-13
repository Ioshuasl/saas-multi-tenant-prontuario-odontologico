import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getObjectStorage, ObjectStorageError } from '../../../../shared/storage/index.js';
import {
  AttachmentNotFoundError,
  StorageUnavailableError,
} from '../../models/errors/clinical_records.errors.js';
import { DOWNLOAD_EXPIRES_SECONDS } from '../../helpers/attachment_storage.helper.js';
import { GetRepository } from '../../repositories/attachment/attachment_get.repository.js';
import type { AttachmentDownloadResult } from '../../types/attachment/attachment_presign.types.js';

export class DownloadService {
  constructor(private readonly getAttachment = new GetRepository()) {}

  async execute(ctx: RequestContext, attachmentId: string): Promise<AttachmentDownloadResult> {
    const attachment = await this.getAttachment.execute(ctx, attachmentId);
    if (!attachment) throw new AttachmentNotFoundError();

    try {
      const signed = await getObjectStorage().presignGet(
        attachment.storageKey,
        DOWNLOAD_EXPIRES_SECONDS,
      );
      return {
        downloadUrl: signed.url,
        expiresIn: DOWNLOAD_EXPIRES_SECONDS,
        patientId: attachment.patientId,
        attachmentId: attachment.id,
      };
    } catch (err) {
      if (err instanceof ObjectStorageError) throw new StorageUnavailableError();
      throw err;
    }
  }
}

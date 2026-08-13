import type { JobPayload } from '../../../shared/queue/job_payload.js';
import { getObjectStorage, ObjectStorageError } from '../../../shared/storage/index.js';
import { THUMBNAIL_MIMES } from '../helpers/attachment_storage.helper.js';
import { GetRepository } from '../repositories/attachment/attachment_get.repository.js';
import { UpdateThumbnailRepository } from '../repositories/attachment/attachment_update_thumbnail.repository.js';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

/** Consumer `clinical_records.attachment_created` — JPEG/PNG/WEBP; original intocado. */
export async function generateAttachmentThumbnailJob(payload: JobPayload): Promise<void> {
  const attachmentId = typeof payload.attachmentId === 'string' ? payload.attachmentId : '';
  if (!attachmentId) return;

  const ctx = {
    tenantId: payload.tenantId,
    userId: SYSTEM_USER_ID,
    requestId: payload.requestId,
  };

  const getAttachment = new GetRepository();
  const updateThumb = new UpdateThumbnailRepository();
  const attachment = await getAttachment.execute(ctx, attachmentId);
  if (!attachment || attachment.thumbnailKey) return;
  if (!THUMBNAIL_MIMES.has(attachment.mimeType)) return;

  const storage = getObjectStorage();
  let original: Buffer | null;
  try {
    original = await storage.getObject(attachment.storageKey);
  } catch (err) {
    if (err instanceof ObjectStorageError) return;
    throw err;
  }
  if (!original) return;

  const thumbnailKey = `${attachment.storageKey}.thumb.jpg`;
  try {
    await storage.putObject(thumbnailKey, original, 'image/jpeg');
  } catch (err) {
    if (err instanceof ObjectStorageError) return;
    throw err;
  }

  await updateThumb.execute(ctx, attachmentId, thumbnailKey);
}

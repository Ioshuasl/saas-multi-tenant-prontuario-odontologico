import {
  ALLOWED_ATTACHMENT_MIMES,
  MAX_ATTACHMENT_BYTES,
} from '../../helpers/attachment_storage.helper.js';
import { ATTACHMENT_CATEGORIES } from '../../enum/attachment/attachment_category.enum.js';
import {
  AttachmentDeleteReasonError,
  AttachmentTooLargeError,
  UnsupportedAttachmentTypeError,
} from '../errors/clinical_records.errors.js';

export type AttachmentProps = {
  id: string;
  patientId: string;
  medicalRecordId: string | null;
  clinicalNoteId: string | null;
  category: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  uploadedBy: string;
  deletedAt: Date | null;
  deletedReason: string | null;
  deletedBy: string | null;
};

export class Attachment {
  private constructor(readonly props: AttachmentProps) {}

  static assertUpload(input: { mimeType: string; sizeBytes: number; category: string }): void {
    if (!(ALLOWED_ATTACHMENT_MIMES as readonly string[]).includes(input.mimeType)) {
      throw new UnsupportedAttachmentTypeError();
    }
    if (input.sizeBytes > MAX_ATTACHMENT_BYTES) {
      throw new AttachmentTooLargeError();
    }
    if (!(ATTACHMENT_CATEGORIES as readonly string[]).includes(input.category)) {
      throw new UnsupportedAttachmentTypeError();
    }
  }

  static create(input: Omit<AttachmentProps, 'deletedAt' | 'deletedReason' | 'deletedBy'>): Attachment {
    Attachment.assertUpload({
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      category: input.category,
    });
    return new Attachment({
      ...input,
      checksumSha256: input.checksumSha256.toLowerCase(),
      deletedAt: null,
      deletedReason: null,
      deletedBy: null,
    });
  }

  static fromPersisted(props: AttachmentProps): Attachment {
    return new Attachment(props);
  }

  delete(reason: string, deletedBy: string, now = new Date()): Attachment {
    const trimmed = reason.trim();
    if (trimmed.length < 10) throw new AttachmentDeleteReasonError();
    return new Attachment({
      ...this.props,
      deletedAt: now,
      deletedReason: trimmed,
      deletedBy,
    });
  }
}

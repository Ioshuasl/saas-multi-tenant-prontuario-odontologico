import type { AttachmentSummary } from '../../../types/attachment/attachment_list.types.js';

export function mapAttachment(row: {
  id: string;
  patientId: string;
  medicalRecordId: string | null;
  clinicalNoteId: string | null;
  category: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: bigint;
  checksumSha256: string;
  thumbnailKey: string | null;
  uploadedBy: string;
  createdAt: Date;
  deletedAt: Date | null;
}): AttachmentSummary {
  return {
    id: row.id,
    patientId: row.patientId,
    medicalRecordId: row.medicalRecordId,
    clinicalNoteId: row.clinicalNoteId,
    category: row.category,
    fileName: row.fileName,
    storageKey: row.storageKey,
    mimeType: row.mimeType,
    sizeBytes: Number(row.sizeBytes),
    checksumSha256: row.checksumSha256,
    thumbnailKey: row.thumbnailKey,
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

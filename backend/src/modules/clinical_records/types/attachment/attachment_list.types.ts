export type AttachmentSummary = {
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
  thumbnailKey: string | null;
  uploadedBy: string;
  createdAt: string;
  deletedAt: string | null;
};

export type AttachmentListResult = {
  items: AttachmentSummary[];
};

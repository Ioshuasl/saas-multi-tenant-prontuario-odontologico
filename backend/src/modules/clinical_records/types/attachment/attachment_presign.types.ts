export type AttachmentPresignResult = {
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  storageKey: string;
  expiresIn: number;
};

export type AttachmentDownloadResult = {
  downloadUrl: string;
  expiresIn: number;
  patientId: string;
  attachmentId: string;
};

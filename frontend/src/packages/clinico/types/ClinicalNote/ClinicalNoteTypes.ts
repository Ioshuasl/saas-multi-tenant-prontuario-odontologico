export type ClinicalNoteProcedure = {
  procedureId: string;
  toothCode?: string | null;
  face?: string | null;
};

export type ClinicalNoteSignature = {
  type: string;
  userId: string;
  croNumber: string;
  croState: string | null;
  ip?: string;
};

export type ClinicalNoteSummary = {
  id: string;
  appointmentId: string | null;
  professionalId: string;
  content: string;
  procedures: ClinicalNoteProcedure[];
  version: number;
  supersedesId: string | null;
  amendReason: string | null;
  contentHash: string;
  signedAt: string;
  signature: ClinicalNoteSignature;
  createdAt: string;
};

export type ClinicalNoteListResult = {
  items: ClinicalNoteSummary[];
  nextCursor: string | null;
};

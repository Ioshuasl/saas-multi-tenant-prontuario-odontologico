export type CreateSignedNoteInput = {
  patientId: string;
  content: string;
  appointmentId?: string | null;
  professional: {
    id: string;
    userId: string;
    croNumber: string | null;
    croState: string | null;
  };
  procedures?: Array<{
    procedureId: string;
    toothCode?: string | null;
    face?: string | null;
  }>;
};

export type CreateSignedNoteResult = {
  id: string;
  professionalId: string;
};

export type ApplyExecutionToothStateInput = {
  patientId: string;
  toothCode: string;
  condition: string;
  face?: string | null;
  dentition?: 'PERMANENT' | 'DECIDUOUS';
  justification?: string | null;
  sourceId?: string | null;
};

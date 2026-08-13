export type OdontogramHistoryItem = {
  at: string;
  fromCondition: string | null;
  toCondition: string;
  source: string;
};

export type OdontogramTooth = {
  toothCode: string;
  face: string | null;
  condition: string;
  notes: string | null;
  recordedAt: string;
  recordedBy: string;
  history?: OdontogramHistoryItem[];
};

export type OdontogramGetResult = {
  patientId: string;
  medicalRecordId: string;
  dentition: string;
  at: string | null;
  teeth: OdontogramTooth[];
};

export type OdontogramToothUpdateInput = {
  dentition: 'PERMANENT' | 'DECIDUOUS';
  face?: string | null;
  condition: string;
  notes?: string | null;
  justification?: string | null;
};

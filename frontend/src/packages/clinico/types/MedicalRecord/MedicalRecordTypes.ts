export type ClinicalAlertSummary = {
  id: string;
  severity: string;
  category: string;
  description: string;
  source: string;
  active: boolean;
};

export type MedicalRecordHeader = {
  patientId: string;
  medicalRecordId: string;
  openedAt: string;
  anamnesisStale: boolean;
  lastAnamnesisAt: string | null;
  alerts: ClinicalAlertSummary[];
};

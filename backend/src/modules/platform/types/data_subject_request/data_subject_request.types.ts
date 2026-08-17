import type { DsrStatus } from '../../enum/data_subject_request/data_subject_request_status.enum.js';
import type { DsrType } from '../../enum/data_subject_request/data_subject_request_type.enum.js';

export type DataSubjectRequestRow = {
  id: string;
  patientId: string;
  type: DsrType;
  status: DsrStatus;
  requestedAt: string;
  dueAt: string;
  completedAt: string | null;
  handledBy: string | null;
  resolution: string | null;
  exportKey: string | null;
};

export type DataSubjectRequestView = {
  id: string;
  patientId: string;
  type: DsrType;
  status: DsrStatus;
  requestedAt: string;
  dueAt: string;
  completedAt: string | null;
  handledBy: string | null;
  resolution: string | null;
  exportUrl: string | null;
  expiresIn: number | null;
};

export type DataSubjectRequestListResult = {
  items: DataSubjectRequestView[];
  nextCursor: string | null;
};

export type DataSubjectRequestListQuery = {
  patientId?: string;
  status?: DsrStatus;
  type?: DsrType;
  cursor?: string;
  limit: number;
};

export type DataSubjectRequestDueRow = {
  id: string;
  type: DsrType;
  dueAt: Date;
};

export type PatientPackageSnapshot = {
  patient: Record<string, unknown>;
  unitId: string;
  appointments: Array<Record<string, unknown>>;
  clinicalNotes: Array<Record<string, unknown>>;
  anamnesisResponses: Array<Record<string, unknown>>;
  clinicalAlerts: Array<Record<string, unknown>>;
  odontogram: Array<Record<string, unknown>>;
  receivables: Array<Record<string, unknown>>;
  payments: Array<Record<string, unknown>>;
  attachments: Array<{ id: string; fileName: string; mimeType: string; sizeBytes: number }>;
};

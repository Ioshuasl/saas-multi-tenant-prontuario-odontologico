import type { DsrStatus } from '../../../enum/data_subject_request/data_subject_request_status.enum.js';
import type { DsrType } from '../../../enum/data_subject_request/data_subject_request_type.enum.js';
import type {
  DataSubjectRequestRow,
  DataSubjectRequestView,
} from '../../../types/data_subject_request/data_subject_request.types.js';

type DataSubjectRequestDb = {
  id: string;
  patientId: string;
  type: string;
  status: string;
  requestedAt: Date;
  dueAt: Date;
  completedAt: Date | null;
  handledBy: string | null;
  resolution: string | null;
  exportKey: string | null;
};

export function mapDataSubjectRequest(row: DataSubjectRequestDb): DataSubjectRequestRow {
  return {
    id: row.id,
    patientId: row.patientId,
    type: row.type as DsrType,
    status: row.status as DsrStatus,
    requestedAt: row.requestedAt.toISOString(),
    dueAt: row.dueAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    handledBy: row.handledBy,
    resolution: row.resolution,
    exportKey: row.exportKey,
  };
}

export function toDataSubjectRequestView(
  row: DataSubjectRequestRow,
  extra?: { exportUrl: string | null; expiresIn: number | null },
): DataSubjectRequestView {
  return {
    id: row.id,
    patientId: row.patientId,
    type: row.type,
    status: row.status,
    requestedAt: row.requestedAt,
    dueAt: row.dueAt,
    completedAt: row.completedAt,
    handledBy: row.handledBy,
    resolution: row.resolution,
    exportUrl: extra?.exportUrl ?? null,
    expiresIn: extra?.expiresIn ?? null,
  };
}

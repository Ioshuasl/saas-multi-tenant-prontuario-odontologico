export const DataSubjectRequestStatus = {
  RECEIVED: 'RECEIVED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
} as const;

export type DataSubjectRequestStatus =
  (typeof DataSubjectRequestStatus)[keyof typeof DataSubjectRequestStatus];

export const DATA_SUBJECT_REQUEST_STATUSES = Object.values(DataSubjectRequestStatus);

export const DATA_SUBJECT_REQUEST_STATUS_LABELS: Record<DataSubjectRequestStatus, string> = {
  RECEIVED: 'Recebida',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  REJECTED: 'Recusada',
};

export const DATA_SUBJECT_REQUEST_TERMINAL_STATUSES: DataSubjectRequestStatus[] = [
  DataSubjectRequestStatus.COMPLETED,
  DataSubjectRequestStatus.REJECTED,
];

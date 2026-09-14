import type { DataSubjectRequest } from '@/packages/admin/types/DataSubjectRequest/DataSubjectRequestTypes';

export type DataSubjectRequestTableProps = {
  requests: DataSubjectRequest[];
  patientNames: Record<string, string>;
  onComplete: (request: DataSubjectRequest) => void;
  onReject: (request: DataSubjectRequest) => void;
};

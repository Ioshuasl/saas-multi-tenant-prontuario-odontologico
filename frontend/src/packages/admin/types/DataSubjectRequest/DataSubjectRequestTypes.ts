import type { DataSubjectRequestStatus } from '@/packages/admin/enum/DataSubjectRequest/DataSubjectRequestStatusEnum';
import type { DataSubjectRequestType } from '@/packages/admin/enum/DataSubjectRequest/DataSubjectRequestTypeEnum';

export type DataSubjectRequest = {
  id: string;
  patientId: string;
  type: DataSubjectRequestType;
  status: DataSubjectRequestStatus;
  requestedAt: string;
  dueAt: string;
  completedAt: string | null;
  handledBy: string | null;
  resolution: string | null;
  exportUrl: string | null;
  expiresIn: number | null;
};

export type DataSubjectRequestListQuery = {
  patientId?: string;
  status?: DataSubjectRequestStatus;
  type?: DataSubjectRequestType;
  cursor?: string;
  limit?: number;
};

export type DataSubjectRequestListResult = {
  items: DataSubjectRequest[];
  nextCursor: string | null;
};

export type DataSubjectRequestCreateInput = {
  patientId: string;
  type: DataSubjectRequestType;
  notes?: string;
};

export type DataSubjectRequestUpdateInput = {
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  resolution?: string;
};

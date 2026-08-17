import type { DataSubjectRequest } from '@/packages/admin/types/DataSubjectRequest/DataSubjectRequestTypes';

export type DataSubjectRequestResolveFormDialogProps = {
  request: DataSubjectRequest;
  status: 'COMPLETED' | 'REJECTED';
  onClose: () => void;
};

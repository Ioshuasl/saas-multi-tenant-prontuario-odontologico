import { DataSubjectRequestCreateData } from '@/packages/admin/data/DataSubjectRequest/DataSubjectRequestCreateData';
import type { DataSubjectRequestCreateInput } from '@/packages/admin/types/DataSubjectRequest/DataSubjectRequestTypes';

export async function DataSubjectRequestCreateService(
  dataSubjectRequestSchema: DataSubjectRequestCreateInput,
) {
  return DataSubjectRequestCreateData(dataSubjectRequestSchema);
}

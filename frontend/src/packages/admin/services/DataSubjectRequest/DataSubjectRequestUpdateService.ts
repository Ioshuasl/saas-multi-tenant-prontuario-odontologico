import { DataSubjectRequestUpdateData } from '@/packages/admin/data/DataSubjectRequest/DataSubjectRequestUpdateData';
import type { DataSubjectRequestUpdateInput } from '@/packages/admin/types/DataSubjectRequest/DataSubjectRequestTypes';

export async function DataSubjectRequestUpdateService(
  id: string,
  dataSubjectRequestSchema: DataSubjectRequestUpdateInput,
) {
  return DataSubjectRequestUpdateData(id, dataSubjectRequestSchema);
}

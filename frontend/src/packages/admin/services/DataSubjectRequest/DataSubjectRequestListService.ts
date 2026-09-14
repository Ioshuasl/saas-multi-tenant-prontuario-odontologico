import { DataSubjectRequestListData } from '@/packages/admin/data/DataSubjectRequest/DataSubjectRequestListData';
import type { DataSubjectRequestListQuery } from '@/packages/admin/types/DataSubjectRequest/DataSubjectRequestTypes';

export async function DataSubjectRequestListService(query: DataSubjectRequestListQuery = {}) {
  return DataSubjectRequestListData(query);
}

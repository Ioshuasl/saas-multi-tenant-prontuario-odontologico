import { DataSubjectRequestGetData } from '@/packages/admin/data/DataSubjectRequest/DataSubjectRequestGetData';

export async function DataSubjectRequestGetService(id: string) {
  return DataSubjectRequestGetData(id);
}

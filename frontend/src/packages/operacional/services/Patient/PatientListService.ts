import { PatientListData } from '@/packages/operacional/data/Patient/PatientListData';
import type { PatientListQuery } from '@/packages/operacional/types/Patient/PatientTypes';

export async function PatientListService(query: PatientListQuery = {}) {
  return PatientListData(query);
}

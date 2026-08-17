import { PatientListData } from '@/packages/financeiro/data/Patient/PatientListData';

export async function PatientListService(search = '') {
  return PatientListData(search);
}

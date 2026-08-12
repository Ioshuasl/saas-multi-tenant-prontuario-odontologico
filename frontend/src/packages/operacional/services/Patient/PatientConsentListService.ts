import { PatientConsentListData } from '@/packages/operacional/data/Patient/PatientConsentListData';

export async function PatientConsentListService(patientId: string) {
  return PatientConsentListData(patientId);
}

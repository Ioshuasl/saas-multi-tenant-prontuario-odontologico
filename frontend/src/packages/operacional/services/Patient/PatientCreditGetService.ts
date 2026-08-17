import { PatientCreditGetData } from '@/packages/operacional/data/Patient/PatientCreditGetData';

export async function PatientCreditGetService(patientId: string) {
  return PatientCreditGetData(patientId);
}

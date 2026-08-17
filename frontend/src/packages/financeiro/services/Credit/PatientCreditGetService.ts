import { PatientCreditGetData } from '@/packages/financeiro/data/Credit/PatientCreditGetData';

export async function PatientCreditGetService(patientId: string) {
  return PatientCreditGetData(patientId);
}

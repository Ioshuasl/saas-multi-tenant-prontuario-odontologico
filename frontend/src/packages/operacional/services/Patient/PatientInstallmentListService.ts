import { PatientInstallmentListData } from '@/packages/operacional/data/Patient/PatientInstallmentListData';

export async function PatientInstallmentListService(patientId: string) {
  return PatientInstallmentListData(patientId);
}

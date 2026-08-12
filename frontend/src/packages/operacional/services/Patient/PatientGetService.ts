import { PatientGetData } from '@/packages/operacional/data/Patient/PatientGetData';

export async function PatientGetService(patientId: string) {
  return PatientGetData(patientId);
}

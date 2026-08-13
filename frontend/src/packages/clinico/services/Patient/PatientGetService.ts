import { PatientGetData } from '@/packages/clinico/data/Patient/PatientGetData';

export async function PatientGetService(patientId: string) {
  return PatientGetData(patientId);
}

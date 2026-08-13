import { MedicalRecordGetData } from '@/packages/clinico/data/MedicalRecord/MedicalRecordGetData';

export async function MedicalRecordGetService(patientId: string) {
  return MedicalRecordGetData(patientId);
}

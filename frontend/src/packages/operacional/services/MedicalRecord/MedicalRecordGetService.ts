import { MedicalRecordGetData } from '@/packages/operacional/data/MedicalRecord/MedicalRecordGetData';

export async function MedicalRecordGetService(patientId: string) {
  return MedicalRecordGetData(patientId);
}

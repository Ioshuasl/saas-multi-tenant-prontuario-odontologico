import { PatientCreateData } from '@/packages/operacional/data/Patient/PatientCreateData';
import type { PatientCreateFormValues } from '@/packages/operacional/schemas/Patient/PatientSchema';

export async function PatientCreateService(patientSchema: PatientCreateFormValues) {
  return PatientCreateData(patientSchema);
}

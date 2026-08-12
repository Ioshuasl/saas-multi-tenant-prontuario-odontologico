import { PatientUpdateData } from '@/packages/operacional/data/Patient/PatientUpdateData';
import type { PatientUpdateFormValues } from '@/packages/operacional/schemas/Patient/PatientSchema';

export async function PatientUpdateService(
  patientId: string,
  patientSchema: PatientUpdateFormValues,
) {
  return PatientUpdateData(patientId, patientSchema);
}

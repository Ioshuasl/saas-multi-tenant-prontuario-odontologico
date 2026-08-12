import { PatientGuardianCreateData } from '@/packages/operacional/data/Patient/PatientGuardianCreateData';
import type { GuardianCreateFormValues } from '@/packages/operacional/schemas/Patient/PatientSchema';

export async function PatientGuardianCreateService(
  patientId: string,
  guardianSchema: GuardianCreateFormValues,
) {
  return PatientGuardianCreateData(patientId, guardianSchema);
}

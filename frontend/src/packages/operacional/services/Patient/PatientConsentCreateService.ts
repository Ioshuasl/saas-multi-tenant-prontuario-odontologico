import { PatientConsentCreateData } from '@/packages/operacional/data/Patient/PatientConsentCreateData';
import type { ConsentCreateFormValues } from '@/packages/operacional/schemas/Patient/PatientSchema';

export async function PatientConsentCreateService(
  patientId: string,
  consentSchema: ConsentCreateFormValues,
) {
  return PatientConsentCreateData(patientId, consentSchema);
}

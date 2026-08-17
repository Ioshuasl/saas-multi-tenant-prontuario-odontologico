import { apiClient } from '@/shared/api/api-client';
import type { PatientCredit } from '@/packages/financeiro/types/Payment/PaymentTypes';

export async function PatientCreditGetData(patientId: string): Promise<PatientCredit> {
  return apiClient.request<PatientCredit>(`/patients/${encodeURIComponent(patientId)}/credit`);
}

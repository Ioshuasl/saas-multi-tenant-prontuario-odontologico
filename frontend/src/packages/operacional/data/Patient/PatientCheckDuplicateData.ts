import { apiClient } from '@/shared/api/api-client';
import type { CheckDuplicateResult } from '@/packages/operacional/types/Patient/PatientTypes';

export async function PatientCheckDuplicateData(input: {
  cpf?: string;
  phone?: string;
}): Promise<CheckDuplicateResult> {
  const params = new URLSearchParams();
  if (input.cpf) params.set('cpf', input.cpf);
  if (input.phone) params.set('phone', input.phone);
  return apiClient.request<CheckDuplicateResult>(`/patients/check-duplicate?${params}`);
}

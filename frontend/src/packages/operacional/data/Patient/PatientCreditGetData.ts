import { apiClient } from '@/shared/api/api-client';

export type PatientCreditSummary = {
  patientId: string;
  balanceCents: number;
};

export async function PatientCreditGetData(patientId: string): Promise<PatientCreditSummary> {
  return apiClient.request<PatientCreditSummary>(
    `/patients/${encodeURIComponent(patientId)}/credit`,
  );
}

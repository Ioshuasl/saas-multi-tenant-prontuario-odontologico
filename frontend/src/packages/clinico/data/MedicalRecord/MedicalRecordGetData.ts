import { apiClient } from '@/shared/api/api-client';
import type { MedicalRecordHeader } from '@/packages/clinico/types/MedicalRecord/MedicalRecordTypes';

export async function MedicalRecordGetData(patientId: string): Promise<MedicalRecordHeader> {
  return apiClient.request<MedicalRecordHeader>(`/patients/${encodeURIComponent(patientId)}/record`);
}

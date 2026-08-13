import { apiClient } from '@/shared/api/api-client';
import type { Dentition } from '@/packages/clinico/enum/Odontogram/DentitionEnum';
import type { OdontogramGetResult } from '@/packages/clinico/types/Odontogram/OdontogramTypes';

export async function OdontogramGetData(
  patientId: string,
  dentition: Dentition,
): Promise<OdontogramGetResult> {
  const params = new URLSearchParams({ dentition });
  return apiClient.request<OdontogramGetResult>(
    `/patients/${encodeURIComponent(patientId)}/record/odontogram?${params.toString()}`,
  );
}

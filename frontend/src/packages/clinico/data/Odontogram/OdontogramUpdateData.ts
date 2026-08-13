import { apiClient } from '@/shared/api/api-client';
import type { OdontogramToothUpdateInput } from '@/packages/clinico/types/Odontogram/OdontogramTypes';

export async function OdontogramUpdateData(input: {
  patientId: string;
  toothCode: string;
  odontogramSchema: OdontogramToothUpdateInput;
}) {
  return apiClient.request(
    `/patients/${encodeURIComponent(input.patientId)}/record/odontogram/teeth/${encodeURIComponent(input.toothCode)}`,
    {
      method: 'PUT',
      body: JSON.stringify(input.odontogramSchema),
    },
  );
}

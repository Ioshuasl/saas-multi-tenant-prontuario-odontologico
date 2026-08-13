import { apiClient } from '@/shared/api/api-client';
import type { AnamnesisSendLinkFormValues } from '@/packages/operacional/schemas/Anamnesis/AnamnesisSendLinkSchema';
import type { AnamnesisSendLinkResult } from '@/packages/operacional/types/Anamnesis/AnamnesisTypes';

export async function AnamnesisSendLinkData(
  patientId: string,
  sendLinkSchema: AnamnesisSendLinkFormValues,
): Promise<AnamnesisSendLinkResult> {
  return apiClient.request<AnamnesisSendLinkResult>(
    `/patients/${encodeURIComponent(patientId)}/record/anamnesis/send-link`,
    {
      method: 'POST',
      body: JSON.stringify(sendLinkSchema),
    },
  );
}

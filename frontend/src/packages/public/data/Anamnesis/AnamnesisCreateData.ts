import { apiClient } from '@/shared/api/api-client';
import type { PublicAnamnesisSubmitResult } from '@/packages/public/types/Anamnesis/AnamnesisTypes';

export async function AnamnesisCreateData(
  token: string,
  answers: Record<string, unknown>,
): Promise<PublicAnamnesisSubmitResult> {
  return apiClient.request<PublicAnamnesisSubmitResult>(
    `/public/anamnesis/${encodeURIComponent(token)}`,
    {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ answers }),
    },
  );
}

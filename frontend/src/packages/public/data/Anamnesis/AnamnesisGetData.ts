import { apiClient } from '@/shared/api/api-client';
import type { PublicAnamnesisGetResult } from '@/packages/public/types/Anamnesis/AnamnesisTypes';

export async function AnamnesisGetData(token: string): Promise<PublicAnamnesisGetResult> {
  return apiClient.request<PublicAnamnesisGetResult>(
    `/public/anamnesis/${encodeURIComponent(token)}`,
    { skipAuth: true },
  );
}

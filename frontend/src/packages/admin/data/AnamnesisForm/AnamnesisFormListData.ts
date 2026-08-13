import { apiClient } from '@/shared/api/api-client';
import type { AnamnesisFormSummary } from '@/packages/admin/types/AnamnesisForm/AnamnesisFormTypes';

export async function AnamnesisFormListData(): Promise<AnamnesisFormSummary[]> {
  const result = await apiClient.request<{ items: AnamnesisFormSummary[] }>('/anamnesis-forms');
  return result.items;
}

import { apiClient } from '@/shared/api/api-client';
import type { ProfessionalSummary } from '@/packages/admin/types/Professional/ProfessionalTypes';

export async function ProfessionalListData(): Promise<ProfessionalSummary[]> {
  return apiClient.request<ProfessionalSummary[]>('/clinic/professionals');
}

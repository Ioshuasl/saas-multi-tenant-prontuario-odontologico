import { apiClient } from '@/shared/api/api-client';
import type { ProfessionalOption } from '@/packages/financeiro/types/Report/ReportTypes';

export async function ProfessionalListData(): Promise<ProfessionalOption[]> {
  return apiClient.request<ProfessionalOption[]>('/clinic/professionals');
}

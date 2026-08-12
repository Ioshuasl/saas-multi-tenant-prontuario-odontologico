import { apiClient } from '@/shared/api/api-client';
import type { ProfessionalSummary } from '@/packages/admin/types/Professional/ProfessionalTypes';

export type ProfessionalCreateInput = {
  membershipId: string;
  croNumber?: string | null;
  croState?: string | null;
  specialties?: string[];
  color?: string | null;
};

export async function ProfessionalCreateData(
  professionalSchema: ProfessionalCreateInput,
): Promise<ProfessionalSummary> {
  return apiClient.request<ProfessionalSummary>('/clinic/professionals', {
    method: 'POST',
    body: JSON.stringify(professionalSchema),
  });
}

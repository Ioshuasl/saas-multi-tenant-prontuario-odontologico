import { apiClient } from '@/shared/api/api-client';
import type { ProfessionalSummary } from '@/packages/admin/types/Professional/ProfessionalTypes';

export type ProfessionalUpdateInput = {
  croNumber?: string | null;
  croState?: string | null;
  specialties?: string[];
  color?: string | null;
  active?: boolean;
};

export async function ProfessionalUpdateData(
  professionalId: string,
  professionalSchema: ProfessionalUpdateInput,
): Promise<ProfessionalSummary> {
  return apiClient.request<ProfessionalSummary>(`/clinic/professionals/${professionalId}`, {
    method: 'PATCH',
    body: JSON.stringify(professionalSchema),
  });
}

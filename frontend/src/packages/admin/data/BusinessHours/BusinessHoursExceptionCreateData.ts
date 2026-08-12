import { apiClient } from '@/shared/api/api-client';
import type { BusinessHoursException } from '@/packages/admin/types/BusinessHours/BusinessHoursTypes';

export type BusinessHoursExceptionCreateInput = {
  unitId: string;
  professionalId?: string | null;
  date: string;
  closed: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  reason?: string | null;
};

export async function BusinessHoursExceptionCreateData(
  input: BusinessHoursExceptionCreateInput,
): Promise<BusinessHoursException> {
  return apiClient.request<BusinessHoursException>('/clinic/business-hours/exceptions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

import { apiClient } from '@/shared/api/api-client';
import type {
  AppointmentCreateInput,
  AppointmentSummary,
} from '@/packages/operacional/types/Appointment/AppointmentTypes';

export async function AppointmentCreateData(
  appointmentSchema: AppointmentCreateInput,
  idempotencyKey?: string,
): Promise<AppointmentSummary> {
  return apiClient.request<AppointmentSummary>('/appointments', {
    method: 'POST',
    body: JSON.stringify(appointmentSchema),
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

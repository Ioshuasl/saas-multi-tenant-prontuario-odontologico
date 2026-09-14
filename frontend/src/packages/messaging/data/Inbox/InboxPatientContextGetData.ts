import { apiClient } from '@/shared/api/api-client';
import type {
  InboxNextAppointment,
  InboxPatientContext,
  InboxPatientSummary,
} from '@/packages/messaging/types/Inbox/InboxPatientContextTypes';

export async function InboxPatientContextGetData(
  patientId: string,
): Promise<InboxPatientContext> {
  const patient = await apiClient.request<InboxPatientSummary>(`/patients/${patientId}`);
  const from = new Date().toISOString();
  const appointments = await apiClient.request<InboxNextAppointment[]>(
    `/appointments?patientId=${encodeURIComponent(patientId)}&from=${encodeURIComponent(from)}`,
  );
  const upcoming = (Array.isArray(appointments) ? appointments : [])
    .filter((row) => row.status !== 'CANCELLED' && row.status !== 'NO_SHOW')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return {
    patient: {
      id: patient.id,
      name: patient.name,
      phonePrimary: patient.phonePrimary,
    },
    nextAppointment: upcoming[0] ?? null,
  };
}

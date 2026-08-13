import { apiClient } from '@/shared/api/api-client';
import type { ClinicalNoteSummary } from '@/packages/clinico/types/ClinicalNote/ClinicalNoteTypes';

export async function ClinicalNoteCreateData(input: {
  patientId: string;
  content: string;
  appointmentId?: string | null;
}): Promise<ClinicalNoteSummary> {
  return apiClient.request<ClinicalNoteSummary>(
    `/patients/${encodeURIComponent(input.patientId)}/record/notes`,
    {
      method: 'POST',
      body: JSON.stringify({
        content: input.content,
        appointmentId: input.appointmentId ?? null,
      }),
    },
  );
}

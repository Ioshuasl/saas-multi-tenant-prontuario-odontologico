import { apiClient } from '@/shared/api/api-client';
import type { ClinicalNoteAmendFormValues } from '@/packages/clinico/schemas/ClinicalNote/ClinicalNoteSchema';
import type { ClinicalNoteSummary } from '@/packages/clinico/types/ClinicalNote/ClinicalNoteTypes';

export async function ClinicalNoteAmendData(input: {
  patientId: string;
  noteId: string;
  noteSchema: ClinicalNoteAmendFormValues;
}): Promise<ClinicalNoteSummary> {
  return apiClient.request<ClinicalNoteSummary>(
    `/patients/${encodeURIComponent(input.patientId)}/record/notes/${encodeURIComponent(input.noteId)}/amend`,
    {
      method: 'POST',
      body: JSON.stringify(input.noteSchema),
    },
  );
}

import { apiClient } from '@/shared/api/api-client';
import type { ClinicalNoteListResult } from '@/packages/clinico/types/ClinicalNote/ClinicalNoteTypes';

export async function ClinicalNoteListData(patientId: string): Promise<ClinicalNoteListResult> {
  return apiClient.request<ClinicalNoteListResult>(
    `/patients/${encodeURIComponent(patientId)}/record/notes?limit=50`,
  );
}

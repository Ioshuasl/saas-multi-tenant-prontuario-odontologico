import { ClinicalNoteListData } from '@/packages/clinico/data/ClinicalNote/ClinicalNoteListData';

export async function ClinicalNoteListService(patientId: string) {
  return ClinicalNoteListData(patientId);
}

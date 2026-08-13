import { ClinicalNoteAmendData } from '@/packages/clinico/data/ClinicalNote/ClinicalNoteAmendData';
import type { ClinicalNoteAmendFormValues } from '@/packages/clinico/schemas/ClinicalNote/ClinicalNoteSchema';

export async function ClinicalNoteAmendService(input: {
  patientId: string;
  noteId: string;
  noteSchema: ClinicalNoteAmendFormValues;
}) {
  return ClinicalNoteAmendData(input);
}

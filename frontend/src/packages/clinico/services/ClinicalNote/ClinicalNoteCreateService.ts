import { ClinicalNoteCreateData } from '@/packages/clinico/data/ClinicalNote/ClinicalNoteCreateData';

export async function ClinicalNoteCreateService(input: {
  patientId: string;
  content: string;
  appointmentId?: string | null;
}) {
  return ClinicalNoteCreateData(input);
}

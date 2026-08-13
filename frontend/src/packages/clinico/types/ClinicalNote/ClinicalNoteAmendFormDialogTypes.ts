import type { ClinicalNoteSummary } from '@/packages/clinico/types/ClinicalNote/ClinicalNoteTypes';

export type ClinicalNoteAmendFormDialogProps = {
  patientId: string;
  note: ClinicalNoteSummary;
  onClose: () => void;
};

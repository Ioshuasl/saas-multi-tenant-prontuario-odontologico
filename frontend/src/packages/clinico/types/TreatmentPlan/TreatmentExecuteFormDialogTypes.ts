import type { TreatmentPlanItem } from '@/packages/clinico/types/TreatmentPlan/TreatmentPlanTypes';

export type TreatmentExecuteFormDialogProps = {
  patientId: string;
  appointmentId: string;
  items: TreatmentPlanItem[];
  onClose: () => void;
  onExecuted: () => void;
};

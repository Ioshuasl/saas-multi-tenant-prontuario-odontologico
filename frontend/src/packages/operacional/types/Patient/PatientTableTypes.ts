import type { PatientSummary } from '@/packages/operacional/types/Patient/PatientTypes';

export type PatientTableProps = {
  patients: PatientSummary[];
  onOpen: (patient: PatientSummary) => void;
  loading?: boolean;
};

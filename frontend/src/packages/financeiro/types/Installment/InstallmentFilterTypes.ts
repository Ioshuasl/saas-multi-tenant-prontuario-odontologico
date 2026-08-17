import type { InstallmentListPreset } from '@/packages/financeiro/types/Installment/InstallmentTypes';

export type InstallmentFilterProps = {
  patientSearch: string;
  onPatientSearchChange: (value: string) => void;
  preset: InstallmentListPreset;
  onPresetChange: (value: InstallmentListPreset) => void;
};

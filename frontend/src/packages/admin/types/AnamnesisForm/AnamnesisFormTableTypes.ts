import type { AnamnesisFormSummary } from '@/packages/admin/types/AnamnesisForm/AnamnesisFormTypes';

export type AnamnesisFormTableProps = {
  forms: AnamnesisFormSummary[];
  selectedId: string | null;
  onSelect: (form: AnamnesisFormSummary) => void;
};

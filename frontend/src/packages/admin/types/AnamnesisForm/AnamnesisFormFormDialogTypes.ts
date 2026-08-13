import type { AnamnesisFormSummary } from '@/packages/admin/types/AnamnesisForm/AnamnesisFormTypes';

export type AnamnesisFormFormDialogProps = {
  source?: AnamnesisFormSummary;
  onClose: () => void;
};

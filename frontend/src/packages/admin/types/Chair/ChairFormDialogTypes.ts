import type { ChairSummary } from '@/packages/admin/types/Chair/ChairTypes';

export type ChairFormDialogProps = {
  mode: 'create' | 'edit';
  unitId: string;
  chair?: ChairSummary;
  onClose: () => void;
};

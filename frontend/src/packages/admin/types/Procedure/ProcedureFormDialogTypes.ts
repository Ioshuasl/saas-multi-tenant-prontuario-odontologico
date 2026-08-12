import type { ProcedureSummary } from '@/packages/admin/types/Procedure/ProcedureTypes';

export type ProcedureFormDialogProps = {
  mode: 'create' | 'edit';
  procedure?: ProcedureSummary;
  onClose: () => void;
};

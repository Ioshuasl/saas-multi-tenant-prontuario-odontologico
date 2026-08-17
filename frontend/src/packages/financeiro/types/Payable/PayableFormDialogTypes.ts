import type { Payable } from '@/packages/financeiro/types/Payable/PayableTypes';

export type PayableFormDialogProps = {
  unitId: string;
  payable?: Payable;
  onClose: () => void;
};

export type PayablePayFormDialogProps = {
  payable: Payable;
  onClose: () => void;
};

export type PayableTableProps = {
  payables: Payable[];
  categoryNames: Record<string, string>;
  onEdit: (payable: Payable) => void;
  onPay: (payable: Payable) => void;
};

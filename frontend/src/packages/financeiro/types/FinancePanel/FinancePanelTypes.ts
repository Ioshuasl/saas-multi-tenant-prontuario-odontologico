import type { Installment } from '@/packages/financeiro/types/Installment/InstallmentTypes';
import type { Payable } from '@/packages/financeiro/types/Payable/PayableTypes';

export type FinanceMovementKind = 'entrada' | 'saida';

export type FinanceAttentionItem = {
  id: string;
  kind: FinanceMovementKind;
  title: string;
  detail: string;
  whenLabel: string;
  amountCents: number;
  urgency: 'danger' | 'warning' | 'info';
  installment?: Installment;
  payable?: Payable;
};

export type FinanceMovementItem = {
  id: string;
  kind: FinanceMovementKind;
  title: string;
  detail: string;
  dueDate: string;
  amountCents: number;
  installment?: Installment;
  payable?: Payable;
};

export type FinanceMovementFilter = 'todas' | 'entradas' | 'saidas';

export type MovementFormDrawerProps = {
  installments: Installment[];
  payables: Payable[];
  patientNames: Record<string, string>;
  onClose: () => void;
  onPickEntrada: (installment: Installment) => void;
  onPickSaida: (payable: Payable) => void;
  onCreateSaida: () => void;
};

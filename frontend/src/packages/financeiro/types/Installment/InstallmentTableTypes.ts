import type { Installment } from '@/packages/financeiro/types/Installment/InstallmentTypes';

export type InstallmentTableProps = {
  installments: Installment[];
  patientNames: Record<string, string>;
  onPay: (installment: Installment) => void;
};

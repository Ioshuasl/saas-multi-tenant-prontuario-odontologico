import type { Installment } from '@/packages/financeiro/types/Installment/InstallmentTypes';

export type PaymentFormDialogProps = {
  installment: Installment;
  patientName: string;
  onClose: () => void;
};

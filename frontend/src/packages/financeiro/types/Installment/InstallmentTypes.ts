import type { InstallmentStatus } from '@/packages/financeiro/enum/Installment/InstallmentStatusEnum';

export type Installment = {
  id: string;
  receivableId: string;
  patientId: string;
  unitId: string;
  number: number;
  dueDate: string;
  amountCents: number;
  paidCents: number;
  status: InstallmentStatus;
  paidAt: string | null;
};

export type InstallmentListQuery = {
  patientId?: string;
  status?: InstallmentStatus;
  dueFrom?: string;
  dueTo?: string;
  cursor?: string;
  limit?: number;
};

export type InstallmentListResult = {
  items: Installment[];
  nextCursor: string | null;
};

export type InstallmentListPreset = '' | 'due_today' | 'overdue';

import type { PayableStatus } from '@/packages/financeiro/enum/Payable/PayableStatusEnum';
import type { PaymentMethod } from '@/packages/financeiro/enum/Payment/PaymentMethodEnum';

export type PayableRecurrence = {
  frequency: 'MONTHLY';
  until?: string | null;
};

export type Payable = {
  id: string;
  unitId: string;
  categoryId: string | null;
  supplier: string | null;
  description: string;
  amountCents: number;
  dueDate: string;
  paidAt: string | null;
  paidCents: number | null;
  method: PaymentMethod | null;
  recurrence: PayableRecurrence | null;
  status: PayableStatus;
  spawnedPayableId?: string | null;
};

export type PayableListQuery = {
  status?: PayableStatus;
  dueFrom?: string;
  dueTo?: string;
  cursor?: string;
  limit?: number;
};

export type PayableListResult = {
  items: Payable[];
  nextCursor: string | null;
};

export type PayableCreateInput = {
  unitId: string;
  categoryId: string;
  description: string;
  amountCents: number;
  dueDate: string;
  supplier?: string | null;
  recurrence?: PayableRecurrence | null;
};

export type PayableUpdateInput = {
  categoryId?: string;
  description?: string;
  amountCents?: number;
  dueDate?: string;
  supplier?: string | null;
  recurrence?: PayableRecurrence | null;
};

export type PayablePayInput = {
  method: PaymentMethod;
  paidAt?: string | null;
};

export type PayablePayResult = {
  payableId: string;
  status: PayableStatus;
  cashSessionId: string | null;
  spawnedPayableId: string | null;
};

export type FinancialCategory = {
  id: string;
  name: string;
  kind: 'REVENUE' | 'EXPENSE';
  parentId: string | null;
  active: boolean;
};

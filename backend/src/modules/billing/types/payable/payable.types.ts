import type { PayableStatus } from '../../enum/payable/payable_status.enum.js';
import type { PaymentMethod } from '../../enum/payment/payment_method.enum.js';
import type { PayableRecurrence } from '../../models/overdue.model.js';

export type PayableDto = {
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

export type PayableListResult = {
  items: PayableDto[];
  nextCursor: string | null;
};

export type PayablePayResult = {
  payableId: string;
  status: PayableStatus;
  cashSessionId: string | null;
  spawnedPayableId: string | null;
};

import type { CashMovementKind } from '../../enum/cash_movement/cash_movement_kind.enum.js';
import type { CashSessionStatus } from '../../enum/cash_session/cash_session_status.enum.js';
import type { PaymentMethod } from '../../enum/payment/payment_method.enum.js';

export type CashMethodAmountDto = {
  method: PaymentMethod;
  amountCents: number;
};

export type CashCountedDto = {
  method: PaymentMethod;
  countedCents: number;
};

export type CashExpectedDto = {
  method: PaymentMethod;
  expectedCents: number;
};

export type CashMovementDto = {
  id: string;
  kind: CashMovementKind;
  method: PaymentMethod;
  amountCents: number;
  description: string | null;
  paymentId: string | null;
  createdAt: string;
};

export type CashSessionDto = {
  id: string;
  unitId: string;
  status: CashSessionStatus;
  openedBy: string;
  openedAt: string;
  openingCents: number;
  openingByMethod: CashMethodAmountDto[];
  expectedCents: number;
  expectedByMethod: CashExpectedDto[];
  countedCents: number | null;
  countedByMethod: CashCountedDto[] | null;
  differenceCents: number | null;
  differenceReason: string | null;
  closedAt: string | null;
  openForHours: number;
  openTooLong: boolean;
  movements: CashMovementDto[];
};

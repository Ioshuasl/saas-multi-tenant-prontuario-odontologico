import type { CashMovementKind } from '@/packages/financeiro/enum/CashSession/CashMovementKindEnum';
import type { CashSessionStatus } from '@/packages/financeiro/enum/CashSession/CashSessionStatusEnum';
import type { PaymentMethod } from '@/packages/financeiro/enum/Payment/PaymentMethodEnum';

export type CashMethodAmount = {
  method: PaymentMethod;
  amountCents: number;
};

export type CashCounted = {
  method: PaymentMethod;
  countedCents: number;
};

export type CashExpected = {
  method: PaymentMethod;
  expectedCents: number;
};

export type CashMovement = {
  id: string;
  kind: string;
  method: PaymentMethod;
  amountCents: number;
  description: string | null;
  paymentId: string | null;
  createdAt: string;
};

export type CashSession = {
  id: string;
  unitId: string;
  status: CashSessionStatus;
  openedBy: string;
  openedAt: string;
  openingCents: number;
  openingByMethod: CashMethodAmount[];
  expectedCents: number;
  expectedByMethod: CashExpected[];
  countedCents: number | null;
  countedByMethod: CashCounted[] | null;
  differenceCents: number | null;
  differenceReason: string | null;
  closedAt: string | null;
  openForHours: number;
  openTooLong: boolean;
  movements: CashMovement[];
};

export type CashSessionCreateInput = {
  unitId: string;
  openingCents: number;
  openingByMethod?: CashMethodAmount[];
};

export type CashSessionCloseInput = {
  countedByMethod: CashCounted[];
  differenceReason?: string | null;
};

export type CashMovementCreateInput = {
  kind: CashMovementKind;
  amountCents: number;
  method: PaymentMethod;
  reason: string;
};

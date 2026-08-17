import type { AgingBand } from '@/packages/financeiro/enum/Report/AgingBandEnum';
import type { CashFlowBasis } from '@/packages/financeiro/enum/Report/CashFlowBasisEnum';
import type { PaymentMethod } from '@/packages/financeiro/enum/Payment/PaymentMethodEnum';
import type { ReceiptSendChannel } from '@/packages/financeiro/enum/Payment/ReceiptSendChannelEnum';

export type CashFlowReport = {
  basis: CashFlowBasis;
  openingBalanceCents: number;
  inflowsCents: number;
  outflowsCents: number;
  closingBalanceCents: number;
  byDay: Array<{ date: string; inflowsCents: number; outflowsCents: number; balanceCents: number }>;
  byCategory: {
    inflows: Array<{ category: string; amountCents: number }>;
    outflows: Array<{ category: string; amountCents: number }>;
  };
  byPaymentMethod: Array<{ method: PaymentMethod; amountCents: number }>;
};

export type CashFlowQuery = {
  from: string;
  to: string;
  basis: CashFlowBasis;
  unitId?: string;
};

export type OverdueItem = {
  installmentId: string;
  receivableId: string;
  patientId: string;
  patientCode: number;
  dueDate: string;
  remainingCents: number;
  daysOverdue: number;
};

export type OverdueBucket = {
  band: AgingBand;
  count: number;
  totalCents: number;
  items: OverdueItem[];
};

export type OverdueReport = {
  buckets: OverdueBucket[];
};

export type ProductionRow = {
  professionalId: string;
  professionalName: string;
  procedureName: string;
  patientCode: number;
  executedAt: string;
  executedCents: number;
};

export type ProductionItem = {
  professionalId: string;
  professionalName: string;
  executedCents: number;
  receivedCents: number;
  proceduresCount: number;
};

export type ProductionReport = {
  items: ProductionItem[];
  rows: ProductionRow[];
};

export type ProductionQuery = {
  from: string;
  to: string;
  professionalId?: string;
};

export type InstallmentChargeInput = {
  channel: ReceiptSendChannel;
};

export type InstallmentChargeResult = {
  sentVia: ReceiptSendChannel;
  installmentId: string;
  copyText?: string;
};

export type ProfessionalOption = {
  id: string;
  name: string;
  active: boolean;
};

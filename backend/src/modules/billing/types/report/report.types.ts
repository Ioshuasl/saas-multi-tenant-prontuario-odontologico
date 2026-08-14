import type { CashFlowBasis } from '../../enum/report/cash_flow_basis.enum.js';
import type { AgingBand } from '../../enum/report/aging_band.enum.js';
import type { PaymentMethod } from '../../enum/payment/payment_method.enum.js';

export type CashFlowLine = {
  date: string;
  amountCents: bigint;
  category: string;
  method: PaymentMethod | null;
};

export type CashFlowRaw = {
  openingInflowsCents: bigint;
  openingOutflowsCents: bigint;
  inflows: CashFlowLine[];
  outflows: CashFlowLine[];
};

export type CashFlowDto = {
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

export type OverdueItemDto = {
  installmentId: string;
  receivableId: string;
  patientId: string;
  patientCode: number;
  dueDate: string;
  remainingCents: number;
  daysOverdue: number;
};

export type OverdueBucketDto = {
  band: AgingBand;
  count: number;
  totalCents: number;
  items: OverdueItemDto[];
};

export type OverdueReportDto = {
  buckets: OverdueBucketDto[];
};

export type ProductionRowDto = {
  professionalId: string;
  professionalName: string;
  procedureName: string;
  patientCode: number;
  executedAt: string;
  executedCents: number;
};

export type ProductionItemDto = {
  professionalId: string;
  professionalName: string;
  executedCents: number;
  receivedCents: number;
  proceduresCount: number;
};

export type ProductionReportDto = {
  items: ProductionItemDto[];
  rows: ProductionRowDto[];
};

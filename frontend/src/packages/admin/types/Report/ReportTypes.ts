import type { RevenueGroupBy } from '@/packages/admin/enum/Report/RevenueGroupByEnum';

export type ReportPeriodQuery = {
  from?: string;
  to?: string;
  professionalId?: string;
  unitId?: string;
};

export type NoShowItem = {
  appointmentId: string;
  status: string;
  startsAt: string;
  professionalId: string;
  professionalName: string;
  procedureName: string | null;
  estimatedLossCents: number;
};

export type NoShowReport = {
  from: string;
  to: string;
  noShowCount: number;
  cancelledCount: number;
  estimatedLossCents: number;
  items: NoShowItem[];
};

export type RevenueItem = {
  key: string;
  amountCents: number;
  count: number;
  professionalId?: string;
  professionalName?: string;
};

export type RevenueReport = {
  from: string;
  to: string;
  groupBy: RevenueGroupBy;
  totalCents: number;
  count: number;
  items: RevenueItem[];
};

export type RevenueQuery = ReportPeriodQuery & {
  groupBy?: RevenueGroupBy;
};

export type ProcedureReportItem = {
  procedureId: string;
  procedureName: string;
  count: number;
  executedCents: number;
};

export type ProcedureReport = {
  from: string;
  to: string;
  items: ProcedureReportItem[];
};

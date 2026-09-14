import type { ExportableReport } from '@/packages/admin/enum/Report/ExportableReportEnum';
import type { ExportFormat } from '@/packages/admin/enum/Report/ExportFormatEnum';
import type { ExportStatus } from '@/packages/admin/enum/Report/ExportStatusEnum';
import type { RevenueGroupBy } from '@/packages/admin/enum/Report/RevenueGroupByEnum';

export type DashboardAgendaByStatus = Record<string, number>;

export type DashboardReport = {
  date: string;
  timezone: string;
  agendaByStatus: DashboardAgendaByStatus;
  receivableTodayCents: number;
  receivableTodayCount: number;
  noShowsMonthCount: number;
  productionMonthCents: number;
  drillDown: {
    agenda: string;
    receivableToday: string;
    noShows: string;
    production: string;
  };
};

export type DashboardQuery = {
  date?: string;
  unitId?: string;
};

export type NoShowItem = {
  appointmentId: string;
  patientId: string;
  patientCode: number;
  professionalId: string;
  professionalName: string;
  procedureName: string | null;
  status: string;
  startsAt: string;
  estimatedLossCents: number;
};

export type NoShowsReport = {
  from: string;
  to: string;
  noShowCount: number;
  cancelledCount: number;
  estimatedLossCents: number;
  items: NoShowItem[];
};

export type NoShowsQuery = {
  from: string;
  to: string;
  professionalId?: string;
  unitId?: string;
};

export type RevenueBucket = {
  key: string;
  label: string;
  amountCents: number;
  count: number;
};

export type RevenueReport = {
  from: string;
  to: string;
  groupBy: RevenueGroupBy;
  totalCents: number;
  buckets: RevenueBucket[];
};

export type RevenueQuery = {
  from: string;
  to: string;
  groupBy?: RevenueGroupBy;
  unitId?: string;
};

export type ProcedureReportItem = {
  procedureId: string;
  procedureCode: string;
  procedureName: string;
  count: number;
  totalCents: number;
};

export type ProceduresReport = {
  from: string;
  to: string;
  items: ProcedureReportItem[];
};

export type ProceduresQuery = {
  from: string;
  to: string;
  professionalId?: string;
  unitId?: string;
};

export type ReportExportCreateInput = {
  format?: ExportFormat;
  from?: string;
  to?: string;
  date?: string;
  unitId?: string;
  professionalId?: string;
  groupBy?: RevenueGroupBy;
};

export type ReportExportCreateResult = {
  exportId: string;
  status: ExportStatus;
};

export type ReportExportGetResult = {
  id: string;
  report: ExportableReport;
  format: ExportFormat;
  status: ExportStatus;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  downloadUrl: string | null;
  downloadExpiresInSeconds: number | null;
};

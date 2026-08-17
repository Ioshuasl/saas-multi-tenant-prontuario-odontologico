import type { ExportFormat, ExportReport, ExportStatus } from '@/packages/admin/enum/Report/ExportEnum';
import type { RevenueGroupBy } from '@/packages/admin/enum/Report/RevenueGroupByEnum';

export type ExportCreateInput = {
  format: ExportFormat;
  from?: string;
  to?: string;
  professionalId?: string;
  unitId?: string;
  groupBy?: RevenueGroupBy;
};

export type ExportCreateResult = {
  exportId: string;
  status: ExportStatus;
};

export type ExportGetResult = {
  id: string;
  report: ExportReport;
  format: ExportFormat;
  status: ExportStatus;
  url: string | null;
  expiresIn: number | null;
  error: string | null;
  createdAt: string;
};

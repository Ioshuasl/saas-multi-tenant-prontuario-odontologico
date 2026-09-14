import type { ExportFormat, ExportReport, ExportStatus } from '../../enum/export/export.enum.js';

export type ReportExportFilters = {
  from?: string;
  to?: string;
  professionalId?: string;
  unitId?: string;
  groupBy?: 'day' | 'month' | 'professional';
};

export type ReportExportRow = {
  id: string;
  report: ExportReport;
  format: ExportFormat;
  status: ExportStatus;
  filters: ReportExportFilters;
  storageKey: string | null;
  requestedBy: string;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReportExportCreateResult = {
  exportId: string;
  status: ExportStatus;
};

export type ReportExportGetResult = {
  id: string;
  report: ExportReport;
  format: ExportFormat;
  status: ExportStatus;
  url: string | null;
  expiresIn: number | null;
  error: string | null;
  createdAt: string;
};

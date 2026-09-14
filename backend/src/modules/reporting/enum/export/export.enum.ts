export const EXPORT_FORMATS = ['CSV', 'XLSX'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const EXPORT_STATUSES = ['PENDING', 'RUNNING', 'READY', 'FAILED'] as const;
export type ExportStatus = (typeof EXPORT_STATUSES)[number];

export const EXPORT_REPORTS = ['no-shows', 'revenue', 'procedures'] as const;
export type ExportReport = (typeof EXPORT_REPORTS)[number];

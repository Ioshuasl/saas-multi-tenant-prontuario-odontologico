export const EXPORTABLE_REPORTS = [
  'dashboard',
  'no-shows',
  'revenue',
  'procedures',
] as const;

export type ExportableReport = (typeof EXPORTABLE_REPORTS)[number];

export const EXPORTABLE_REPORT_LABELS: Record<ExportableReport, string> = {
  dashboard: 'Dashboard',
  'no-shows': 'Faltas',
  revenue: 'Receita',
  procedures: 'Procedimentos',
};

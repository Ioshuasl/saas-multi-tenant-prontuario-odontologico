export const EXPORT_STATUSES = ['PENDING', 'RUNNING', 'READY', 'FAILED'] as const;

export type ExportStatus = (typeof EXPORT_STATUSES)[number];

export const EXPORT_STATUS_LABELS: Record<ExportStatus, string> = {
  PENDING: 'Na fila',
  RUNNING: 'Gerando…',
  READY: 'Pronto',
  FAILED: 'Falhou',
};

export const APPOINTMENT_STATUSES = [
  'REQUESTED',
  'SCHEDULED',
  'CONFIRMED',
  'IN_SERVICE',
  'COMPLETED',
  'NO_SHOW',
  'CANCELLED',
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** Pastéis Notion + rótulo (não só cor — a11y). */
export const APPOINTMENT_STATUS_META: Record<
  AppointmentStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  REQUESTED: {
    label: 'Solicitado',
    bg: 'bg-[#E9E9E7] dark:bg-muted',
    text: 'text-[#787774] dark:text-muted-foreground',
    border: 'border-[#D3D1CB] dark:border-border',
  },
  SCHEDULED: {
    label: 'Agendado',
    bg: 'bg-[#E7F3F8] dark:bg-sky-950/60',
    text: 'text-[#0B6E99] dark:text-sky-300',
    border: 'border-[#B4D7E8] dark:border-sky-800',
  },
  CONFIRMED: {
    label: 'Confirmado',
    bg: 'bg-[#EDF3EC] dark:bg-emerald-950/50',
    text: 'text-[#448361] dark:text-emerald-300',
    border: 'border-[#C4D9C2] dark:border-emerald-800',
  },
  IN_SERVICE: {
    label: 'Em atendimento',
    bg: 'bg-[#FBF3DB] dark:bg-amber-950/50',
    text: 'text-[#9F6B53] dark:text-amber-200',
    border: 'border-[#E8D5A3] dark:border-amber-800',
  },
  COMPLETED: {
    label: 'Concluído',
    bg: 'bg-[#F1F1EF] dark:bg-muted',
    text: 'text-[#37352F] dark:text-foreground',
    border: 'border-[#E3E2E0] dark:border-border',
  },
  NO_SHOW: {
    label: 'Falta',
    bg: 'bg-[#FDEBEC] dark:bg-red-950/50',
    text: 'text-[#C14C4A] dark:text-red-300',
    border: 'border-[#E8B4B4] dark:border-red-800',
  },
  CANCELLED: {
    label: 'Cancelado',
    bg: 'bg-[#F1F1EF] dark:bg-muted',
    text: 'text-[#9B9A97] dark:text-muted-foreground',
    border: 'border-[#E3E2E0] dark:border-border',
  },
};

export const SERIES_DELETE_SCOPES = ['THIS', 'FUTURE', 'ALL'] as const;
export type SeriesDeleteScope = (typeof SERIES_DELETE_SCOPES)[number];

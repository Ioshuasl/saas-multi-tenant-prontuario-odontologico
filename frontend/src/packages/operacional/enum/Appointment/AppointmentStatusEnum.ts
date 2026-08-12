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
    bg: 'bg-[#E9E9E7]',
    text: 'text-[#787774]',
    border: 'border-[#D3D1CB]',
  },
  SCHEDULED: {
    label: 'Agendado',
    bg: 'bg-[#E7F3F8]',
    text: 'text-[#0B6E99]',
    border: 'border-[#B4D7E8]',
  },
  CONFIRMED: {
    label: 'Confirmado',
    bg: 'bg-[#EDF3EC]',
    text: 'text-[#448361]',
    border: 'border-[#C4D9C2]',
  },
  IN_SERVICE: {
    label: 'Em atendimento',
    bg: 'bg-[#FBF3DB]',
    text: 'text-[#9F6B53]',
    border: 'border-[#E8D5A3]',
  },
  COMPLETED: {
    label: 'Concluído',
    bg: 'bg-[#F1F1EF]',
    text: 'text-[#37352F]',
    border: 'border-[#E3E2E0]',
  },
  NO_SHOW: {
    label: 'Falta',
    bg: 'bg-[#FDEBEC]',
    text: 'text-[#C14C4A]',
    border: 'border-[#E8B4B4]',
  },
  CANCELLED: {
    label: 'Cancelado',
    bg: 'bg-[#F1F1EF]',
    text: 'text-[#9B9A97]',
    border: 'border-[#E3E2E0]',
  },
};

export const SERIES_DELETE_SCOPES = ['THIS', 'FUTURE', 'ALL'] as const;
export type SeriesDeleteScope = (typeof SERIES_DELETE_SCOPES)[number];

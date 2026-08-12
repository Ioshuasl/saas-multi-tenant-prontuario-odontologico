export type BusinessHoursSlot = {
  id: string;
  weekday: number;
  startsAt: string;
  endsAt: string;
};

export type ScheduleConflictSummary = {
  appointmentId: string;
  startsAt: string;
  endsAt: string;
};

export type BusinessHoursException = {
  id: string;
  unitId: string;
  professionalId: string | null;
  date: string;
  closed: boolean;
  startsAt: string | null;
  endsAt: string | null;
  reason: string | null;
  conflicts: ScheduleConflictSummary[];
};

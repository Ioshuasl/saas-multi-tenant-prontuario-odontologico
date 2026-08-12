export type AppointmentSummary = {
  id: string;
  unitId: string;
  patientId: string;
  professionalId: string;
  chairId: string | null;
  procedureId: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  origin: string;
  notes: string | null;
  cancelReason: string | null;
  confirmedAt: string | null;
  arrivedAt: string | null;
  cancelledAt: string | null;
  recurrenceId: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: { id: string; name: string; phonePrimary: string };
  professional?: { id: string; name: string };
  procedure?: { id: string; name: string; defaultMinutes: number } | null;
};

export type AppointmentHistoryItem = {
  id: string;
  appointmentId: string;
  action: string;
  fromValue: unknown;
  toValue: unknown;
  actorId: string | null;
  actorType: string;
  createdAt: string;
};

export type AvailabilitySlot = {
  startsAt: string;
  endsAt: string;
  available: boolean;
  reason?: 'BOOKED' | 'BLOCKED' | 'OUT_OF_HOURS';
};

export type AvailabilityResult = {
  date: string;
  timezone: string;
  slotMinutes: number;
  slots: AvailabilitySlot[];
};

export type AppointmentConflictSummary = {
  appointmentId: string;
  startsAt: string;
  endsAt: string;
};

export type ScheduleBlockSummary = {
  id: string;
  unitId: string;
  professionalId: string | null;
  chairId: string | null;
  startsAt: string;
  endsAt: string;
  reason: string;
  createdAt: string;
  /** Agendamentos sobrepostos; bloqueio não cancela (RF-E4-09). */
  conflicts: AppointmentConflictSummary[];
};

export type AppointmentSeriesSummary = {
  id: string;
  unitId: string;
  patientId: string;
  professionalId: string;
  chairId: string | null;
  procedureId: string | null;
  rrule: string;
  startsAt: string;
  durationMinutes: number;
  createdAt: string;
  appointments: AppointmentSummary[];
};

export type TimelineAppointmentItem = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  origin: string;
  procedureName: string | null;
  professionalName: string | null;
};

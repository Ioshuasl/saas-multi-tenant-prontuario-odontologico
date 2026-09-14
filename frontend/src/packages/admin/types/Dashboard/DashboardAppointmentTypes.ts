export type DashboardAppointmentSummary = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  patientId: string;
  patient?: { id: string; name: string; phonePrimary: string };
  professional?: { id: string; name: string } | null;
  procedure?: { id: string; name: string; defaultMinutes: number } | null;
};

export type DashboardAppointmentListQuery = {
  from: string;
  to: string;
};

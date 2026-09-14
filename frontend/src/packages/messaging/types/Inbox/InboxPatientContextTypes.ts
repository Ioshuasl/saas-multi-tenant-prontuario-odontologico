export type InboxPatientSummary = {
  id: string;
  name: string;
  phonePrimary: string;
};

export type InboxNextAppointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  professional?: { id: string; name: string } | null;
  procedure?: { id: string; name: string } | null;
};

export type InboxPatientContext = {
  patient: InboxPatientSummary | null;
  nextAppointment: InboxNextAppointment | null;
};

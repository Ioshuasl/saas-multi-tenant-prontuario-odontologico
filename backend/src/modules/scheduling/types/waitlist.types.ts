export type WaitlistPreferredPeriod = {
  weekday: number;
  from: string;
  to: string;
};

export type WaitlistSummary = {
  id: string;
  unitId: string;
  patientId: string;
  professionalId: string | null;
  procedureId: string | null;
  preferredPeriods: WaitlistPreferredPeriod[];
  priority: number;
  status: string;
  offeredAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  patient?: { id: string; name: string; phonePrimary: string };
  professional?: { id: string; name: string } | null;
  procedure?: { id: string; name: string; defaultMinutes: number } | null;
};

export type WaitlistOfferResult = {
  waitlistEntry: WaitlistSummary;
  offerId: string;
  buttonPayload: string;
  expiresAt: string;
  template: 'waitlist_offer';
  acceptToken?: string;
};

export type WaitlistAcceptResult = {
  appointment: {
    id: string;
    status: string;
    origin: string;
    startsAt: string;
    endsAt: string;
    professionalId: string;
    procedureId: string | null;
    patientId: string;
  };
  waitlistEntry: WaitlistSummary;
};

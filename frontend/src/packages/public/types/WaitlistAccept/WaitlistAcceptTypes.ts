export type WaitlistAcceptProps = {
  token: string;
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
};

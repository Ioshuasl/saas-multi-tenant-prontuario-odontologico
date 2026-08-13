export type BookingConfirmProps = {
  token: string;
};

export type BookingConfirmResult = {
  id: string;
  status: string;
  startsAt: string;
  endsAt: string;
  professional?: { id: string; name: string };
  procedure?: { id: string; name: string; defaultMinutes: number } | null;
};

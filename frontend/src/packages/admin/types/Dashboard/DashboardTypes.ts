export type MoneyCount = {
  count: number;
  amountCents: number;
};

export type DashboardAgenda = {
  total: number;
  byStatus: Record<string, number>;
};

export type DashboardDto = {
  date: string;
  timezone: string;
  agenda: DashboardAgenda;
  receivableToday: MoneyCount | null;
  receivedToday: MoneyCount | null;
  noShowsMonth: { count: number };
  productionMonth: { executedCents: number };
  hrefs: {
    agenda: string;
    receivableToday: string;
    receivedToday: string;
    noShowsMonth: string;
    productionMonth: string;
  };
};

export type DashboardQuery = {
  date?: string;
  unitId?: string;
};

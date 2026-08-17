export type PlanLimits = {
  professionals: number | null;
  users: number | null;
  units: number | null;
  storageGb: number | null;
  monthlyMessages: number | null;
};

export type PlanSummary = {
  id: string;
  code: string;
  name: string;
  priceCents: number;
  interval: string;
  limits: PlanLimits;
  active: boolean;
};

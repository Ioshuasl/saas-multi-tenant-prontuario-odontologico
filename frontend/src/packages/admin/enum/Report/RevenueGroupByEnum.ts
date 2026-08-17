export const REVENUE_GROUP_BY = ['day', 'month', 'professional'] as const;

export type RevenueGroupBy = (typeof REVENUE_GROUP_BY)[number];

export const REVENUE_GROUP_BY_LABELS: Record<RevenueGroupBy, string> = {
  day: 'Por dia',
  month: 'Por mês',
  professional: 'Por profissional',
};

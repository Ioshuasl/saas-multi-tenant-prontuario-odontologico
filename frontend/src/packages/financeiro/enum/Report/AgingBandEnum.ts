export const AGING_BANDS = ['1_15', '16_30', '31_60', '60_plus'] as const;

export type AgingBand = (typeof AGING_BANDS)[number];

export const AGING_BAND_LABELS: Record<AgingBand, string> = {
  '1_15': '1–15 dias',
  '16_30': '16–30 dias',
  '31_60': '31–60 dias',
  '60_plus': '60+ dias',
};

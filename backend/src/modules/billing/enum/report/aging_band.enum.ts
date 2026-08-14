export const AGING_BANDS = ['1_15', '16_30', '31_60', '60_plus'] as const;

export type AgingBand = (typeof AGING_BANDS)[number];

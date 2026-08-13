export const DENTITIONS = ['PERMANENT', 'DECIDUOUS'] as const;

export type Dentition = (typeof DENTITIONS)[number];

export const DENTITION_LABELS: Record<Dentition, string> = {
  PERMANENT: 'Permanente',
  DECIDUOUS: 'Decídua',
};

export const DENTITIONS = ['PERMANENT', 'DECIDUOUS'] as const;

export type Dentition = (typeof DENTITIONS)[number];

export const TOOTH_CONDITIONS = [
  'HEALTHY',
  'CARIES',
  'RESTORED',
  'ABSENT',
  'EXTRACTED',
  'IMPLANT',
  'CROWN',
  'ROOT_CANAL',
  'SEALANT',
  'FRACTURE',
] as const;

export type ToothCondition = (typeof TOOTH_CONDITIONS)[number];

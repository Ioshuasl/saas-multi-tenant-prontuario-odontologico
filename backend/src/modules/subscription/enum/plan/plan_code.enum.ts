export const PlanCode = {
  ESSENCIAL: 'ESSENCIAL',
  CLINICA: 'CLINICA',
  REDE: 'REDE',
} as const;

export type PlanCode = (typeof PlanCode)[keyof typeof PlanCode];

export const PLAN_CODES = Object.values(PlanCode);

export const DEFAULT_PLAN_CODE: PlanCode = PlanCode.ESSENCIAL;

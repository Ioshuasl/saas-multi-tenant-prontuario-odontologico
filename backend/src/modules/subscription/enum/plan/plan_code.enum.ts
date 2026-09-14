/** Códigos de plano seed (docs/modulos/10-billing-saas.md §2). */
export const PlanCode = {
  ESSENCIAL: 'ESSENCIAL',
  CLINICA: 'CLINICA',
  REDE: 'REDE',
} as const;

export type PlanCode = (typeof PlanCode)[keyof typeof PlanCode];

/** UUIDs estáveis do seed de planos. */
export const PLAN_IDS = {
  ESSENCIAL: 'a1000000-0000-4000-8000-000000000001',
  CLINICA: 'a1000000-0000-4000-8000-000000000002',
  REDE: 'a1000000-0000-4000-8000-000000000003',
} as const;

export const DEFAULT_PLAN_ID = PLAN_IDS.ESSENCIAL;

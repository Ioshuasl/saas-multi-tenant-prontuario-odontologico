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

export const TOOTH_CONDITION_LABELS: Record<ToothCondition, string> = {
  HEALTHY: 'Saudável',
  CARIES: 'Cárie',
  RESTORED: 'Restaurado',
  ABSENT: 'Ausente',
  EXTRACTED: 'Extraído',
  IMPLANT: 'Implante',
  CROWN: 'Coroa',
  ROOT_CANAL: 'Canal',
  SEALANT: 'Selante',
  FRACTURE: 'Fratura',
};

export const TOOTH_CONDITION_CLASS: Record<ToothCondition, string> = {
  HEALTHY: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800',
  CARIES: 'bg-red-100 text-red-900 border-red-300 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800',
  RESTORED: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/50 dark:text-sky-200 dark:border-sky-800',
  ABSENT: 'bg-muted text-muted-foreground border-muted-foreground/30',
  EXTRACTED: 'bg-muted text-muted-foreground border-muted-foreground/30',
  IMPLANT: 'bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-950/50 dark:text-violet-200 dark:border-violet-800',
  CROWN: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800',
  ROOT_CANAL: 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/50 dark:text-orange-200 dark:border-orange-800',
  SEALANT: 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950/50 dark:text-teal-200 dark:border-teal-800',
  FRACTURE: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-800',
};

export const TOOTH_CONDITION_FILL: Record<ToothCondition, string> = {
  HEALTHY: 'fill-emerald-100 stroke-emerald-500 dark:fill-emerald-950/60 dark:stroke-emerald-400',
  CARIES: 'fill-red-200 stroke-red-600 dark:fill-red-950/70 dark:stroke-red-400',
  RESTORED: 'fill-sky-200 stroke-sky-600 dark:fill-sky-950/70 dark:stroke-sky-400',
  ABSENT: 'fill-muted stroke-muted-foreground/50',
  EXTRACTED: 'fill-muted stroke-muted-foreground/50',
  IMPLANT: 'fill-violet-200 stroke-violet-600 dark:fill-violet-950/70 dark:stroke-violet-400',
  CROWN: 'fill-amber-200 stroke-amber-600 dark:fill-amber-950/70 dark:stroke-amber-400',
  ROOT_CANAL: 'fill-orange-200 stroke-orange-600 dark:fill-orange-950/70 dark:stroke-orange-400',
  SEALANT: 'fill-teal-200 stroke-teal-600 dark:fill-teal-950/70 dark:stroke-teal-400',
  FRACTURE: 'fill-rose-200 stroke-rose-600 dark:fill-rose-950/70 dark:stroke-rose-400',
};

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
  HEALTHY: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  CARIES: 'bg-red-100 text-red-900 border-red-300',
  RESTORED: 'bg-sky-100 text-sky-900 border-sky-300',
  ABSENT: 'bg-muted text-muted-foreground border-muted-foreground/30',
  EXTRACTED: 'bg-muted text-muted-foreground border-muted-foreground/30',
  IMPLANT: 'bg-violet-100 text-violet-900 border-violet-300',
  CROWN: 'bg-amber-100 text-amber-900 border-amber-300',
  ROOT_CANAL: 'bg-orange-100 text-orange-900 border-orange-300',
  SEALANT: 'bg-teal-100 text-teal-900 border-teal-300',
  FRACTURE: 'bg-rose-100 text-rose-900 border-rose-300',
};

export const TOOTH_CONDITION_FILL: Record<ToothCondition, string> = {
  HEALTHY: 'fill-emerald-100 stroke-emerald-500',
  CARIES: 'fill-red-200 stroke-red-600',
  RESTORED: 'fill-sky-200 stroke-sky-600',
  ABSENT: 'fill-muted stroke-muted-foreground/50',
  EXTRACTED: 'fill-muted stroke-muted-foreground/50',
  IMPLANT: 'fill-violet-200 stroke-violet-600',
  CROWN: 'fill-amber-200 stroke-amber-600',
  ROOT_CANAL: 'fill-orange-200 stroke-orange-600',
  SEALANT: 'fill-teal-200 stroke-teal-600',
  FRACTURE: 'fill-rose-200 stroke-rose-600',
};

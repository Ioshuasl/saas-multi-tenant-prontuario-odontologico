import {
  TOOTH_CONDITION_LABELS,
  type ToothCondition,
} from '@/packages/clinico/enum/Odontogram/ToothConditionEnum';
import type { ToothFace } from '@/packages/clinico/enum/Odontogram/ToothFaceEnum';
import type { OdontogramTooth } from '@/packages/clinico/types/Odontogram/OdontogramTypes';

function isCondition(value: string): value is ToothCondition {
  return value in TOOTH_CONDITION_LABELS;
}

export function odontogramFaceCondition(
  teeth: OdontogramTooth[],
  code: string,
  face: ToothFace | null,
): ToothCondition {
  const matches = teeth.filter((item) => item.toothCode === code);
  if (face) {
    const exact = matches.find((item) => item.face === face);
    if (exact && isCondition(exact.condition)) return exact.condition;
  }
  const whole = matches.find((item) => item.face == null);
  if (whole && isCondition(whole.condition)) return whole.condition;
  return 'HEALTHY';
}

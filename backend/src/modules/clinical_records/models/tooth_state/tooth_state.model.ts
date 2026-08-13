import type { Dentition } from '../../enum/tooth_state/dentition.enum.js';
import type { ToothCondition } from '../../enum/tooth_state/tooth_condition.enum.js';
import type { ToothFace } from '../../enum/tooth_state/tooth_face.enum.js';

const PERMANENT_CODES = new Set(
  ['11', '12', '13', '14', '15', '16', '17', '18',
    '21', '22', '23', '24', '25', '26', '27', '28',
    '31', '32', '33', '34', '35', '36', '37', '38',
    '41', '42', '43', '44', '45', '46', '47', '48'],
);

const DECIDUOUS_CODES = new Set(
  ['51', '52', '53', '54', '55',
    '61', '62', '63', '64', '65',
    '71', '72', '73', '74', '75',
    '81', '82', '83', '84', '85'],
);

const MISSING = new Set<ToothCondition>(['ABSENT', 'EXTRACTED']);

export function isValidToothCode(dentition: Dentition, toothCode: string): boolean {
  if (dentition === 'PERMANENT') return PERMANENT_CODES.has(toothCode);
  return DECIDUOUS_CODES.has(toothCode);
}

export function hasRestorationConflict(
  existingConditions: readonly string[],
  nextCondition: ToothCondition,
): boolean {
  if (nextCondition !== 'RESTORED') return false;
  return existingConditions.some((c) => MISSING.has(c as ToothCondition));
}

export function normalizeFace(face: ToothFace | null | undefined): ToothFace | null {
  return face ?? null;
}

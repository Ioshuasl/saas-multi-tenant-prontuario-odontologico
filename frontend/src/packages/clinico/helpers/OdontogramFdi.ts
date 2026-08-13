export const PERMANENT_UPPER = [
  '18', '17', '16', '15', '14', '13', '12', '11',
  '21', '22', '23', '24', '25', '26', '27', '28',
] as const;

export const PERMANENT_LOWER = [
  '48', '47', '46', '45', '44', '43', '42', '41',
  '31', '32', '33', '34', '35', '36', '37', '38',
] as const;

export const DECIDUOUS_UPPER = [
  '55', '54', '53', '52', '51', '61', '62', '63', '64', '65',
] as const;

export const DECIDUOUS_LOWER = [
  '85', '84', '83', '82', '81', '71', '72', '73', '74', '75',
] as const;

export function odontogramRows(dentition: 'PERMANENT' | 'DECIDUOUS') {
  if (dentition === 'DECIDUOUS') {
    return { upper: [...DECIDUOUS_UPPER], lower: [...DECIDUOUS_LOWER] };
  }
  return { upper: [...PERMANENT_UPPER], lower: [...PERMANENT_LOWER] };
}

export type OdontogramGlyph =
  | 'incisor_central'
  | 'incisor_lateral'
  | 'canine'
  | 'premolar'
  | 'molar_upper'
  | 'molar_lower';

export function odontogramIsUpper(code: string): boolean {
  const quadrant = Number(code[0]);
  return quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6;
}

export function odontogramGlyph(code: string): OdontogramGlyph {
  const position = Number(code[1]);
  const upper = odontogramIsUpper(code);
  if (position === 1) return 'incisor_central';
  if (position === 2) return 'incisor_lateral';
  if (position === 3) return 'canine';
  const deciduousMolar = Number(code[0]) >= 5;
  if (deciduousMolar || position >= 6) return upper ? 'molar_upper' : 'molar_lower';
  return 'premolar';
}

/** Q1 local: raízes para cima, mesial à direita. Inferior = flip Y; hemiarco esquerdo = flip X. */
export function odontogramMirror(code: string): { sx: 1 | -1; sy: 1 | -1 } {
  const quadrant = Number(code[0]);
  const sx: 1 | -1 = quadrant === 2 || quadrant === 3 || quadrant === 6 || quadrant === 7 ? -1 : 1;
  const sy: 1 | -1 = odontogramIsUpper(code) ? 1 : -1;
  return { sx, sy };
}

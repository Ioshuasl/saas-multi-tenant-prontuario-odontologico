export type OdontogramReferenceTooth = {
  code: string;
  x: number;
  y: number;
  w: number;
  h: number;
  arch: 'upper' | 'lower';
};

export const ODONTOGRAM_REFERENCE_SIZE = { width: 1024, height: 434 } as const;

export const ODONTOGRAM_REFERENCE_TEETH: OdontogramReferenceTooth[] = [
  { code: '18', x: 99, y: 80, w: 55, h: 105, arch: 'upper' },
  { code: '17', x: 146, y: 77, w: 63, h: 111, arch: 'upper' },
  { code: '16', x: 203, y: 73, w: 61, h: 114, arch: 'upper' },
  { code: '15', x: 258, y: 60, w: 50, h: 126, arch: 'upper' },
  { code: '14', x: 301, y: 49, w: 55, h: 137, arch: 'upper' },
  { code: '13', x: 350, y: 42, w: 58, h: 147, arch: 'upper' },
  { code: '12', x: 402, y: 55, w: 48, h: 133, arch: 'upper' },
  { code: '11', x: 443, y: 53, w: 58, h: 132, arch: 'upper' },
  { code: '21', x: 505, y: 55, w: 58, h: 131, arch: 'upper' },
  { code: '22', x: 556, y: 55, w: 46, h: 131, arch: 'upper' },
  { code: '23', x: 597, y: 42, w: 56, h: 145, arch: 'upper' },
  { code: '24', x: 647, y: 56, w: 54, h: 130, arch: 'upper' },
  { code: '25', x: 693, y: 60, w: 51, h: 127, arch: 'upper' },
  { code: '26', x: 737, y: 70, w: 62, h: 119, arch: 'upper' },
  { code: '27', x: 792, y: 77, w: 63, h: 110, arch: 'upper' },
  { code: '28', x: 847, y: 82, w: 55, h: 103, arch: 'upper' },
  { code: '48', x: 82, y: 298, w: 67, h: 98, arch: 'lower' },
  { code: '47', x: 143, y: 297, w: 68, h: 110, arch: 'lower' },
  { code: '46', x: 205, y: 298, w: 67, h: 120, arch: 'lower' },
  { code: '45', x: 267, y: 298, w: 55, h: 127, arch: 'lower' },
  { code: '44', x: 317, y: 300, w: 49, h: 126, arch: 'lower' },
  { code: '43', x: 361, y: 297, w: 52, h: 137, arch: 'lower' },
  { code: '42', x: 407, y: 298, w: 47, h: 136, arch: 'lower' },
  { code: '41', x: 448, y: 297, w: 44, h: 126, arch: 'lower' },
  { code: '31', x: 496, y: 296, w: 46, h: 127, arch: 'lower' },
  { code: '32', x: 534, y: 299, w: 46, h: 135, arch: 'lower' },
  { code: '33', x: 574, y: 295, w: 55, h: 139, arch: 'lower' },
  { code: '34', x: 621, y: 297, w: 55, h: 126, arch: 'lower' },
  { code: '35', x: 669, y: 297, w: 56, h: 128, arch: 'lower' },
  { code: '36', x: 719, y: 300, w: 66, h: 120, arch: 'lower' },
  { code: '37', x: 778, y: 297, w: 69, h: 112, arch: 'lower' },
  { code: '38', x: 841, y: 296, w: 64, h: 100, arch: 'lower' },
];

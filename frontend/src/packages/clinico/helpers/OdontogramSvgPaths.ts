import type { ToothFace } from '@/packages/clinico/enum/Odontogram/ToothFaceEnum';
import type { OdontogramGlyph } from '@/packages/clinico/helpers/OdontogramFdi';

/** Vista vestibular. Origem Q1: raízes em y pequeno, coroa em y grande, CEJ ≈ 52. */
export const ODONTOGRAM_VIEWBOX = '0 0 44 100';
export const ODONTOGRAM_CX = 22;
export const ODONTOGRAM_CY = 52;
export const ODONTOGRAM_STROKE = '#5c6d7e';

export const ODONTOGRAM_OUTLINE: Record<OdontogramGlyph, string> = {
  incisor_central:
    'M12 52 C11 36 13 18 22 8 C31 18 33 36 32 52 L35 52 L37 86 L7 86 L9 52 Z',
  incisor_lateral:
    'M14 52 C13 36 15 20 22 10 C29 20 31 36 30 52 L32 52 L33 84 L11 84 L12 52 Z',
  canine:
    'M13 54 C12 32 14 14 22 4 C30 14 32 32 31 54 L34 54 L33 80 L22 94 L11 80 L10 54 Z',
  premolar:
    'M12 53 C13 32 15 16 22 8 C29 16 31 32 32 53 L35 53 L36 78 C34 90 26 92 22 92 C18 92 10 90 8 78 L9 53 Z',
  molar_upper:
    'M6 53 C5 40 7 20 10 10 C12 6 14 8 15 16 L17 40 L19 18 C20 8 21 4 22 4 C23 4 24 8 25 18 L27 40 L29 16 C30 8 32 6 34 10 C37 20 39 40 38 53 L39 78 C39 90 30 95 22 95 C14 95 5 90 5 78 Z',
  molar_lower:
    'M7 53 C6 38 9 16 13 8 C15 4 18 8 19 18 L21 50 L23 18 C24 8 27 4 29 8 C33 16 36 38 35 53 L37 78 C37 90 30 95 22 95 C14 95 7 90 7 78 Z',
};

export const ODONTOGRAM_CEJ: Record<OdontogramGlyph, string> = {
  incisor_central: 'M9 52 L35 52',
  incisor_lateral: 'M12 52 L32 52',
  canine: 'M10 54 L34 54',
  premolar: 'M9 53 L35 53',
  molar_upper: 'M6 53 L38 53',
  molar_lower: 'M7 53 L35 53',
};

export const ODONTOGRAM_OCCLUSAL: Partial<Record<OdontogramGlyph, string>> = {
  premolar:
    'M14 64 C14 60 17 58 22 58 C27 58 30 60 30 64 L30 78 C30 82 27 84 22 84 C17 84 14 82 14 78 Z',
  molar_upper:
    'M12 64 C12 60 16 58 22 58 C28 58 32 60 32 64 L32 82 C32 86 28 88 22 88 C16 88 12 86 12 82 Z',
  molar_lower:
    'M12 64 C12 60 16 58 22 58 C28 58 32 60 32 64 L32 82 C32 86 28 88 22 88 C16 88 12 86 12 82 Z',
};

export const ODONTOGRAM_FACE_PATHS: Record<OdontogramGlyph, Record<ToothFace, string>> = {
  incisor_central: {
    C: 'M9 52 L35 52 L35 58 L9 58 Z',
    V: 'M14 58 L30 58 L30 76 L14 76 Z',
    O: 'M10 80 L34 80 L34 86 L10 86 Z',
    L: 'M14 74 L30 74 L30 80 L14 80 Z',
    D: 'M9 52 L14 52 L14 86 L7 86 L9 52 Z',
    M: 'M30 52 L35 52 L37 86 L30 86 Z',
  },
  incisor_lateral: {
    C: 'M12 52 L32 52 L32 58 L12 58 Z',
    V: 'M16 58 L28 58 L28 74 L16 74 Z',
    O: 'M12 78 L32 78 L32 84 L12 84 Z',
    L: 'M16 72 L28 72 L28 78 L16 78 Z',
    D: 'M12 52 L16 52 L16 84 L11 84 Z',
    M: 'M28 52 L32 52 L33 84 L28 84 Z',
  },
  canine: {
    C: 'M10 54 L34 54 L34 60 L10 60 Z',
    V: 'M15 60 L29 60 L27 78 L17 78 Z',
    O: 'M16 82 L28 82 L22 94 L16 82 Z',
    L: 'M17 76 L27 76 L28 82 L16 82 Z',
    D: 'M10 54 L15 54 L17 80 L11 80 L10 54 Z',
    M: 'M29 54 L34 54 L33 80 L27 80 Z',
  },
  premolar: {
    C: 'M9 53 L35 53 L35 60 L9 60 Z',
    V: 'M14 60 L30 60 L30 66 L14 66 Z',
    O: 'M14 64 C14 60 17 58 22 58 C27 58 30 60 30 64 L30 78 C30 82 27 84 22 84 C17 84 14 82 14 78 Z',
    L: 'M14 84 L30 84 L32 90 L12 90 Z',
    D: 'M9 53 L14 53 L14 88 L8 78 Z',
    M: 'M30 53 L35 53 L36 78 L30 88 Z',
  },
  molar_upper: {
    C: 'M6 53 L38 53 L38 60 L6 60 Z',
    V: 'M14 60 L30 60 L30 66 L14 66 Z',
    O: 'M12 64 C12 60 16 58 22 58 C28 58 32 60 32 64 L32 82 C32 86 28 88 22 88 C16 88 12 86 12 82 Z',
    L: 'M12 88 L32 88 L35 94 L9 94 Z',
    D: 'M5 53 L12 53 L12 90 L5 78 Z',
    M: 'M32 53 L39 53 L39 78 L32 90 Z',
  },
  molar_lower: {
    C: 'M7 53 L35 53 L35 60 L7 60 Z',
    V: 'M14 60 L30 60 L30 66 L14 66 Z',
    O: 'M12 64 C12 60 16 58 22 58 C28 58 32 60 32 64 L32 82 C32 86 28 88 22 88 C16 88 12 86 12 82 Z',
    L: 'M12 88 L32 88 L34 94 L10 94 Z',
    D: 'M7 53 L12 53 L12 90 L7 78 Z',
    M: 'M32 53 L37 53 L37 78 L32 90 Z',
  },
};

export const ODONTOGRAM_ABSENT_MARK = 'M10 20 L34 88 M34 20 L10 88';

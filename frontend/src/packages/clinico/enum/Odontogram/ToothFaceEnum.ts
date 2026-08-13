export const TOOTH_FACES = ['M', 'D', 'V', 'L', 'O', 'C'] as const;

export type ToothFace = (typeof TOOTH_FACES)[number];

export const TOOTH_FACE_LABELS: Record<ToothFace, string> = {
  M: 'Mesial',
  D: 'Distal',
  V: 'Vestibular',
  L: 'Lingual',
  O: 'Oclusal',
  C: 'Cervical',
};

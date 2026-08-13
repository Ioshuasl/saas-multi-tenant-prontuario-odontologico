export const TOOTH_FACES = ['M', 'D', 'V', 'L', 'O', 'C'] as const;

export type ToothFace = (typeof TOOTH_FACES)[number];

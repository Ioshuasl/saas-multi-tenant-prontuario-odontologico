export const SIGNATURE_TYPES = ['SIMPLE'] as const;

export type SignatureType = (typeof SIGNATURE_TYPES)[number];

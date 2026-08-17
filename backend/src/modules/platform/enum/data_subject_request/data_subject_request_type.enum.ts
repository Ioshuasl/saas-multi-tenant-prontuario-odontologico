export const DSR_TYPES = [
  'ACCESS',
  'CORRECTION',
  'DELETION',
  'PORTABILITY',
  'REVOKE_CONSENT',
] as const;

export type DsrType = (typeof DSR_TYPES)[number];

export const DSR_PACKAGE_TYPES: readonly DsrType[] = ['ACCESS', 'PORTABILITY'];

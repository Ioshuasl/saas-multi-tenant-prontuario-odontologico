import { decryptField } from '../../../shared/crypto/envelope.js';

export function decryptExportField(
  ciphertext: string,
  dek: Buffer | null,
  aad: { tenantId: string; table: string; column: string; rowId: string },
): { value: string | null; decryptError: boolean } {
  if (!dek) return { value: null, decryptError: true };
  try {
    return { value: decryptField(ciphertext, dek, aad), decryptError: false };
  } catch {
    return { value: null, decryptError: true };
  }
}

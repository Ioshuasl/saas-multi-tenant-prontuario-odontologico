import { getKeyManagement } from '../crypto/index.js';
import type { DbTransaction } from './db_transaction.js';

/** Unwrap da DEK ACTIVE do tenant (plaintext só em memória). */
export async function unwrapActiveDek(tx: DbTransaction, tenantId: string): Promise<Buffer> {
  const row = await tx.tenantCryptoKey.findFirst({
    where: { tenantId, status: 'ACTIVE' },
    select: { wrappedDek: true },
  });
  if (!row) {
    throw new Error('DEK ACTIVE ausente para o tenant.');
  }
  return getKeyManagement().unwrapDek(row.wrappedDek);
}

import assert from 'node:assert/strict';
import { decryptField, encryptField } from '../src/shared/crypto/index.js';
import {
  LocalKeyManagementAdapter,
  resolveKekBytes,
} from '../src/shared/crypto/local_key_management.adapter.js';

async function main() {
  const kek = resolveKekBytes(undefined, 'test');
  const kms = new LocalKeyManagementAdapter(kek);
  const dek = kms.generateDek();

  const aad = {
    tenantId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    table: 'clinical_note',
    column: 'content',
    rowId: 'c9d8e7f6-a5b4-3210-fedc-ba0987654321',
  };

  const plaintext = 'Alergia a dipirona — não usar.';
  const blob = encryptField(plaintext, dek, aad);
  assert.notEqual(blob, plaintext);
  assert.equal(Buffer.from(blob, 'base64')[0], 0x01);

  const roundtrip = decryptField(blob, dek, aad);
  assert.equal(roundtrip, plaintext);

  const again = encryptField(plaintext, dek, aad);
  assert.notEqual(again, blob, 'nonce deve variar a cada encrypt');

  let tamperFailed = false;
  try {
    const raw = Buffer.from(blob, 'base64');
    raw[raw.length - 1] ^= 0xff;
    decryptField(raw.toString('base64'), dek, aad);
  } catch {
    tamperFailed = true;
  }
  assert.ok(tamperFailed, 'tag GCM adulterada deve falhar');

  let aadFailed = false;
  try {
    decryptField(blob, dek, { ...aad, tenantId: '00000000-0000-0000-0000-000000000000' });
  } catch {
    aadFailed = true;
  }
  assert.ok(aadFailed, 'AAD divergente deve falhar');

  const otherDek = kms.generateDek();
  let dekFailed = false;
  try {
    decryptField(blob, otherDek, aad);
  } catch {
    dekFailed = true;
  }
  assert.ok(dekFailed, 'DEK errada deve falhar');

  console.log('OK: envelope AES-256-GCM roundtrip + tamper + AAD');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 0x01;
const NONCE_LENGTH = 12;
const TAG_LENGTH = 16;
const HEADER_LENGTH = 1 + NONCE_LENGTH;

export type EnvelopeAad = {
  tenantId: string;
  table: string;
  column: string;
  rowId: string;
};

/** AAD GCM: `tenantId|table|column|rowId` (docs/07 §14). */
export function buildEnvelopeAad(aad: EnvelopeAad): Buffer {
  return Buffer.from(`${aad.tenantId}|${aad.table}|${aad.column}|${aad.rowId}`, 'utf8');
}

/**
 * Cifra plaintext com DEK do tenant (AES-256-GCM).
 * Retorno: Base64(version 1 | nonce 12 | ciphertext | tag 16).
 */
export function encryptField(plaintext: string, dek: Buffer, aad: EnvelopeAad): string {
  if (dek.length !== 32) {
    throw new Error('DEK deve ter 32 bytes (AES-256).');
  }
  const nonce = randomBytes(NONCE_LENGTH);
  const cipher = createCipheriv(ALGORITHM, dek, nonce);
  cipher.setAAD(buildEnvelopeAad(aad));
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([VERSION]), nonce, ciphertext, tag]).toString('base64');
}

/** Decifra blob envelope v1. Falha se AAD/tag/DEK não baterem. */
export function decryptField(ciphertextB64: string, dek: Buffer, aad: EnvelopeAad): string {
  if (dek.length !== 32) {
    throw new Error('DEK deve ter 32 bytes (AES-256).');
  }
  const blob = Buffer.from(ciphertextB64, 'base64');
  if (blob.length < HEADER_LENGTH + TAG_LENGTH + 1) {
    throw new Error('ciphertext envelope inválido.');
  }
  if (blob[0] !== VERSION) {
    throw new Error(`versão de envelope não suportada: ${blob[0]}`);
  }
  const nonce = blob.subarray(1, HEADER_LENGTH);
  const tag = blob.subarray(blob.length - TAG_LENGTH);
  const ciphertext = blob.subarray(HEADER_LENGTH, blob.length - TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, dek, nonce);
  decipher.setAAD(buildEnvelopeAad(aad));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

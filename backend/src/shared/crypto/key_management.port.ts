/**
 * Port de KMS / envelope (ADR-0007, ADR-0013).
 * Wrap/unwrap da DEK com a KEK — implementação trocável (local → Vault).
 */
export type KeyManagementPort = {
  /** Gera DEK AES-256 (32 bytes). Plaintext só em memória. */
  generateDek(): Buffer;

  /** Cifra a DEK com a KEK; retorno em Base64 (nonce|ciphertext|tag). */
  wrapDek(plaintextDek: Buffer): Promise<string>;

  /** Decifra wrapped DEK (Base64) → Buffer 32 bytes. */
  unwrapDek(wrappedDekBase64: string): Promise<Buffer>;
};

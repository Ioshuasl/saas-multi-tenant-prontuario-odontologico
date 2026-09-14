import { maskCpf, maskPhone } from '../../../shared/helpers/mask_pii.js';

const DROP_KEYS = new Set([
  'password',
  'token',
  'dek',
  'wrappeddek',
  'content',
  'body',
  'answers',
  'cpf',
  'secret',
  'authorization',
  'cookie',
  'refreshtoken',
  'accesstoken',
]);

function shouldDrop(key: string): boolean {
  return DROP_KEYS.has(key.toLowerCase());
}

function looksLikeCpfKey(key: string): boolean {
  return /cpf/i.test(key);
}

function looksLikePhoneKey(key: string): boolean {
  if (/masked/i.test(key)) return false;
  return /phone|telefone|^to$/i.test(key);
}

function sanitizeValue(value: unknown, key?: string): unknown {
  if (key && shouldDrop(key)) return undefined;
  if (typeof value === 'string' && key && looksLikeCpfKey(key)) return maskCpf(value);
  if (typeof value === 'string' && key && looksLikePhoneKey(key)) return maskPhone(value);
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
      const sanitized = sanitizeValue(childValue, childKey);
      if (sanitized !== undefined) out[childKey] = sanitized;
    }
    return out;
  }
  return value;
}

/** Payload de GET /audit-logs: sem corpo clínico, senha, token, DEK, CPF completo (docs/17 §5.3). */
export function sanitizeAuditMetadata(metadata: unknown): Record<string, unknown> | null {
  if (metadata === null || metadata === undefined) return null;
  const sanitized = sanitizeValue(metadata);
  if (!sanitized || typeof sanitized !== 'object' || Array.isArray(sanitized)) return null;
  return sanitized as Record<string, unknown>;
}

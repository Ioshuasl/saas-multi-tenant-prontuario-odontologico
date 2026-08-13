export async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export const ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;

export const ATTACHMENT_MIME_ALLOWLIST = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const PRESIGN_EXPIRES_SECONDS = 900;

export const ALLOWED_ATTACHMENT_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export const THUMBNAIL_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const MAX_ATTACHMENT_BYTES = MAX_FILE_BYTES;
export const DOWNLOAD_EXPIRES_SECONDS = PRESIGN_EXPIRES_SECONDS;
export const PRESIGN_TTL_SECONDS = PRESIGN_EXPIRES_SECONDS;

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

export function isAllowedAttachmentMime(mimeType: string): boolean {
  return (ALLOWED_ATTACHMENT_MIMES as readonly string[]).includes(mimeType);
}

export function extensionForMime(mimeType: string): string {
  return MIME_EXT[mimeType] ?? 'bin';
}

export function sanitizeFileName(fileName: string): string {
  const base = fileName.replace(/\\/g, '/').split('/').pop() ?? 'file';
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  return cleaned.length > 0 ? cleaned : 'file';
}

export function buildAttachmentStorageKey(input: {
  tenantId: string;
  patientId: string;
  objectId: string;
  fileName: string;
  mimeType: string;
}): string {
  const safe = sanitizeFileName(input.fileName);
  const hasExt = /\.[a-z0-9]{1,8}$/i.test(safe);
  const name = hasExt ? safe : `${safe}.${extensionForMime(input.mimeType)}`;
  return `tenants/${input.tenantId}/patients/${input.patientId}/${input.objectId}/${name}`;
}

export function storageKeyBelongsToPatient(
  storageKey: string,
  tenantId: string,
  patientId: string,
): boolean {
  if (storageKey.includes('..') || storageKey.includes('\\')) return false;
  const prefix = `tenants/${tenantId}/patients/${patientId}/`;
  return storageKey.startsWith(prefix) && storageKey.length > prefix.length;
}

const MAX_MEDIA_BYTES = 20 * 1024 * 1024;
export const MESSAGING_MEDIA_PRESIGN_TTL_SECONDS = 900;

export const ALLOWED_MESSAGING_MEDIA_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

export function isAllowedMessagingMediaMime(mimeType: string): boolean {
  return (ALLOWED_MESSAGING_MEDIA_MIMES as readonly string[]).includes(mimeType);
}

export function isMessagingImageMime(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function extensionForMessagingMime(mimeType: string): string {
  return MIME_EXT[mimeType] ?? 'bin';
}

export function sanitizeMessagingFileName(fileName: string): string {
  const base = fileName.replace(/\\/g, '/').split('/').pop() ?? 'file';
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  return cleaned.length > 0 ? cleaned : 'file';
}

export function buildMessagingMediaStorageKey(input: {
  tenantId: string;
  conversationId: string;
  objectId: string;
  fileName: string;
  mimeType: string;
}): string {
  const safe = sanitizeMessagingFileName(input.fileName);
  const hasExt = /\.[a-z0-9]{1,8}$/i.test(safe);
  const name = hasExt ? safe : `${safe}.${extensionForMessagingMime(input.mimeType)}`;
  return `tenants/${input.tenantId}/messaging/${input.conversationId}/${input.objectId}/${name}`;
}

export function storageKeyBelongsToConversation(
  storageKey: string,
  tenantId: string,
  conversationId: string,
): boolean {
  if (storageKey.includes('..') || storageKey.includes('\\')) return false;
  const prefix = `tenants/${tenantId}/messaging/${conversationId}/`;
  return storageKey.startsWith(prefix) && storageKey.length > prefix.length;
}

export const MAX_MESSAGING_MEDIA_BYTES = MAX_MEDIA_BYTES;

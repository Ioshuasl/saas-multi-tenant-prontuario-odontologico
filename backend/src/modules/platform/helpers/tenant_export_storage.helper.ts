export const TENANT_EXPORT_PRESIGN_TTL_SECONDS = 7 * 24 * 60 * 60;

export function buildTenantExportStorageKey(tenantId: string, exportId: string): string {
  return `tenants/${tenantId}/lgpd-exports/${exportId}.zip`;
}

export function safeAttachmentFileName(fileName: string): string {
  const base = fileName.replace(/\\/g, '/').split('/').pop() ?? 'file';
  const cleaned = base.replace(/[^\w.\- ()áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/g, '_').trim();
  return cleaned.length > 0 ? cleaned.slice(0, 180) : 'file';
}

export function attachmentZipPath(attachmentId: string, fileName: string): string {
  return `attachments/${attachmentId}/${safeAttachmentFileName(fileName)}`;
}

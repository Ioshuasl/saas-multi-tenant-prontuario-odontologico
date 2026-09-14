export const PATIENT_PACKAGE_PRESIGN_TTL_SECONDS = 7 * 24 * 60 * 60;

export function buildPatientPackageStorageKey(tenantId: string, dsrId: string): string {
  return `tenants/${tenantId}/dsr/${dsrId}/package.zip`;
}

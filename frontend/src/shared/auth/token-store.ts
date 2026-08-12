let accessToken: string | null = null;
let tenantId: string | null = null;

export const tokenStore = {
  getAccessToken(): string | null {
    return accessToken;
  },
  setAccessToken(token: string | null): void {
    accessToken = token;
  },
  getTenantId(): string | null {
    return tenantId;
  },
  setTenantId(id: string | null): void {
    tenantId = id;
  },
  clear(): void {
    accessToken = null;
    tenantId = null;
  },
};

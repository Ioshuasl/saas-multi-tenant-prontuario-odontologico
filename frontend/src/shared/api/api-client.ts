import type { ApiResponse } from '@repo/contracts';
import { isApiError } from '@repo/contracts';
import { tokenStore } from '@/shared/auth/token-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

type RequestOptions = RequestInit & {
  tenantId?: string;
  skipAuth?: boolean;
};

class ApiClient {
  private refreshing: Promise<string | null> | null = null;

  async request<T>(path: string, init: RequestOptions = {}): Promise<T> {
    const { tenantId, skipAuth, headers, ...rest } = init;
    const activeTenant = tenantId ?? tokenStore.getTenantId();
    const token = skipAuth ? null : tokenStore.getAccessToken();

    const res = await fetch(`${API_URL}/api/v1${path}`, {
      ...rest,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(activeTenant ? { 'X-Tenant-Id': activeTenant } : {}),
        ...(headers ?? {}),
      },
    });

    if (res.status === 401 && !skipAuth && !path.startsWith('/auth/refresh')) {
      const refreshed = await (this.refreshing ??= this.refresh().finally(() => {
        this.refreshing = null;
      }));
      if (refreshed) {
        return this.request<T>(path, init);
      }
    }

    const body = (await res.json()) as ApiResponse<T>;

    if (!res.ok || isApiError(body)) {
      if (isApiError(body)) {
        throw new ApiClientError(
          body.error.code,
          body.error.message,
          res.status,
          body.error.details,
        );
      }
      throw new ApiClientError('HTTP_ERROR', `HTTP ${res.status}`, res.status);
    }

    return body.data;
  }

  async refresh(): Promise<string | null> {
    try {
      const data = await this.request<{ accessToken: string }>('/auth/refresh', {
        method: 'POST',
        skipAuth: true,
      });
      tokenStore.setAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
      tokenStore.clear();
      return null;
    }
  }
}

export const apiClient = new ApiClient();

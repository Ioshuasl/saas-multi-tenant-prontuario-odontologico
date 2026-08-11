import type { ApiResponse } from '@repo/contracts';
import { isApiError } from '@repo/contracts';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const body = (await res.json()) as ApiResponse<T>;

  if (!res.ok || isApiError(body)) {
    if (isApiError(body)) {
      throw new ApiClientError(body.error.code, body.error.message, res.status);
    }
    throw new ApiClientError('HTTP_ERROR', `HTTP ${res.status}`, res.status);
  }

  return body.data;
}

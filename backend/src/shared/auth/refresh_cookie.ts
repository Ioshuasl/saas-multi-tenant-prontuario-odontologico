import type { CookieOptions, Response } from 'express';
import { env } from '../config/env.js';

export const REFRESH_COOKIE_NAME = 'refreshToken';

const REFRESH_COOKIE_PATH = '/api/v1/auth';

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    secure: env.NODE_ENV === 'production',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions());
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    secure: env.NODE_ENV === 'production',
  });
}

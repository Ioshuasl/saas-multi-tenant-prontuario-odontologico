import type { NextFunction, Request, Response } from 'express';
import { assertWritable } from '../../modules/subscription/subscription_public.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function subscriptionGuard(req: Request, _res: Response, next: NextFunction): void {
  void assertSubscriptionRequest(req).then(next).catch(next);
}

async function assertSubscriptionRequest(req: Request): Promise<void> {
  if (!req.ctx) return;
  const method = req.method.toUpperCase();
  if (SAFE_METHODS.has(method)) return;
  if (isAllowedWrite(req.originalUrl ?? req.url ?? '')) return;
  await assertWritable(req.ctx);
}

function isAllowedWrite(url: string): boolean {
  const path = url.split('?')[0] ?? '';
  if (path.includes('/auth/')) return true;
  if (path.includes('/webhooks/')) return true;
  if (path.includes('/reports/') && path.includes('/export')) return true;
  if (path.includes('/privacy/')) return true;
  if (path.includes('/users/invitations/accept')) return true;
  return false;
}

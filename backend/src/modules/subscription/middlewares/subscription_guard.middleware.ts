import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { AssertWritableService } from '../services/subscription/subscription_assert_writable.service.js';

const assertWritable = new AssertWritableService();

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Bloqueia escrita quando assinatura está SUSPENDED/EXPIRED/CANCELLED.
 * Libera GET e exportação de relatórios (POST …/export).
 */
export async function subscriptionGuardMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.ctx) {
      next();
      return;
    }
    if (SAFE_METHODS.has(req.method.toUpperCase())) {
      next();
      return;
    }
    if (isExportAllowed(req)) {
      next();
      return;
    }
    await assertWritable.execute(req.ctx);
    next();
  } catch (err) {
    next(err);
  }
}

export function asyncSubscriptionGuard(): RequestHandler {
  return (req, res, next) => {
    void subscriptionGuardMiddleware(req, res, next);
  };
}

function isExportAllowed(req: Request): boolean {
  const full = `${req.baseUrl}${req.path}`;
  if (req.method.toUpperCase() === 'POST' && /\/reports\/[^/]+\/export\/?$/.test(full)) {
    return true;
  }
  if (req.method.toUpperCase() === 'POST' && /\/privacy\/exports\/?$/.test(full)) {
    return true;
  }
  return false;
}

import type { NextFunction, Request, Response } from 'express';
import { resolveTenantIdBySlug } from '../../modules/clinic/clinic_public.js';
import { AppError } from './error_handler.middleware.js';

/** Resolve tenant pelo slug público. Slug inválido → 404 (não revelar aproximação). */
export function publicTenantContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  void resolvePublicTenant(req).then(next).catch(next);
}

async function resolvePublicTenant(req: Request): Promise<void> {
  const slug = typeof req.params.slug === 'string' ? req.params.slug.trim() : '';
  if (!slug) {
    throw new AppError('NOT_FOUND', 'Clínica não encontrada.', 404);
  }

  const tenantId = await resolveTenantIdBySlug(slug);
  if (!tenantId) {
    throw new AppError('NOT_FOUND', 'Clínica não encontrada.', 404);
  }

  req.ctx = {
    tenantId,
    userId: '',
    requestId: req.requestId,
  };
}

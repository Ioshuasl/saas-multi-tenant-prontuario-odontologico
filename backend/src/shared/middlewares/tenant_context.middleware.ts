import type { NextFunction, Request, Response } from 'express';
import { findActiveMembership } from '../../modules/identity/identity_public.js';
import { subscriptionGuard } from './subscription_guard.middleware.js';
import { AppError } from './error_handler.middleware.js';

/**
 * Resolve tenant a partir do JWT.
 * `X-Tenant-Id` troca o contexto se o usuário tiver membership ativo nesse tenant (RF-E1-14).
 */
export function tenantContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  void resolveTenantContext(req)
    .then(() => {
      subscriptionGuard(req, res, next);
    })
    .catch(next);
}

async function resolveTenantContext(req: Request): Promise<void> {
  if (!req.auth) {
    throw new AppError('UNAUTHENTICATED', 'Contexto de autenticação ausente.', 401);
  }

  const headerTenantId = req.header('x-tenant-id');
  const tokenTenantId = req.auth.tenantId;

  if (!headerTenantId || headerTenantId === tokenTenantId) {
    req.ctx = {
      tenantId: tokenTenantId,
      userId: req.auth.userId,
      requestId: req.requestId,
      membershipId: req.auth.membershipId,
      role: req.auth.role,
      permissions: req.auth.permissions,
    };
    return;
  }

  const membership = await findActiveMembership(req.auth.userId, headerTenantId);
  if (!membership) {
    throw new AppError('TENANT_NOT_ALLOWED', 'Tenant não permitido para este usuário.', 403);
  }

  req.auth = {
    ...req.auth,
    tenantId: membership.tenantId,
    membershipId: membership.id,
    role: membership.role,
    permissions: membership.permissions,
  };

  req.ctx = {
    tenantId: membership.tenantId,
    userId: req.auth.userId,
    requestId: req.requestId,
    membershipId: membership.id,
    role: membership.role,
    permissions: membership.permissions,
  };
}

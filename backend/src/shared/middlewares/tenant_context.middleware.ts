import type { NextFunction, Request, Response } from 'express';
import { findActiveMembership, isPlatformOperator } from '../../modules/identity/identity_public.js';
import { findUsableSupportGrant, SUPPORT_GRANT_PERMISSIONS } from '../../modules/platform/platform_public.js';
import { AuditAction, writeAuditLogSafe } from '../database/write_audit.js';
import { subscriptionGuard } from './subscription_guard.middleware.js';
import { AppError } from './error_handler.middleware.js';

/**
 * Resolve tenant a partir do JWT.
 * `X-Tenant-Id` troca o contexto se o usuário tiver membership ativo nesse tenant (RF-E1-14).
 * Operador de plataforma assume o tenant só com grant break-glass (`X-Support-Grant-Id`).
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
  const grantId = req.header('x-support-grant-id');
  const tokenTenantId = req.auth.tenantId;

  if (grantId) {
    await assumeSupportGrant(req, grantId, headerTenantId);
    return;
  }

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
    if (await isPlatformOperator(req.auth.userId)) {
      throw new AppError('NOT_FOUND', 'Recurso não encontrado.', 404);
    }
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

async function assumeSupportGrant(
  req: Request,
  grantId: string,
  headerTenantId: string | undefined,
): Promise<void> {
  if (!req.auth || !headerTenantId) {
    throw new AppError('NOT_FOUND', 'Recurso não encontrado.', 404);
  }
  if (!(await isPlatformOperator(req.auth.userId))) {
    throw new AppError('NOT_FOUND', 'Recurso não encontrado.', 404);
  }

  const grant = await findUsableSupportGrant({
    grantId,
    tenantId: headerTenantId,
    requesterId: req.auth.userId,
  });
  if (!grant) {
    throw new AppError('NOT_FOUND', 'Recurso não encontrado.', 404);
  }

  const permissions = [...SUPPORT_GRANT_PERMISSIONS];
  req.auth = {
    ...req.auth,
    tenantId: grant.tenantId,
    membershipId: grant.id,
    role: 'SUPPORT',
    permissions,
  };
  req.ctx = {
    tenantId: grant.tenantId,
    userId: req.auth.userId,
    requestId: req.requestId,
    membershipId: grant.id,
    role: 'SUPPORT',
    permissions,
  };

  await writeAuditLogSafe({
    tenantId: grant.tenantId,
    actorId: req.auth.userId,
    actorType: 'SUPPORT',
    action: AuditAction.SUPPORT_ACCESS_USED,
    resourceType: 'support_access',
    resourceId: grant.id,
    ipAddress: req.ip,
    userAgent: req.header('user-agent') ?? undefined,
    metadata: { path: req.originalUrl, method: req.method },
  });
}

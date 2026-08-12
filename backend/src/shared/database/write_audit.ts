import type { Prisma } from '@prisma/client';
import { idGenerator } from '../helpers/id_generator.js';
import { getTenantPrisma } from './tenant_prisma.js';

export const AuditAction = {
  LOGIN: 'LOGIN',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_RESET: 'PASSWORD_RESET',
  ROLE_CHANGED: 'ROLE_CHANGED',
  MEMBER_INVITED: 'MEMBER_INVITED',
  MEMBER_DEACTIVATED: 'MEMBER_DEACTIVATED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  REFRESH_REUSE_DETECTED: 'REFRESH_REUSE_DETECTED',
} as const;

export type AuditActionName = (typeof AuditAction)[keyof typeof AuditAction];

export type WriteAuditInput = {
  tenantId: string;
  actorId?: string;
  actorType?: 'USER' | 'SYSTEM';
  action: AuditActionName;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function writeAuditLog(input: WriteAuditInput): Promise<void> {
  const tenantPrisma = getTenantPrisma();
  await tenantPrisma.runInTenantContext(
    {
      tenantId: input.tenantId,
      userId: input.actorId ?? SYSTEM_USER_ID,
      requestId: 'audit',
    },
    async (tx) => {
      await tx.auditLog.create({
        data: {
          id: idGenerator.next(),
          tenantId: input.tenantId,
          actorId: input.actorId,
          actorType: input.actorType ?? (input.actorId ? 'USER' : 'SYSTEM'),
          action: input.action,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          metadata:
            input.metadata === undefined
              ? undefined
              : (input.metadata as Prisma.InputJsonValue),
        },
      });
    },
  );
}

export async function writeAuditLogSafe(input: WriteAuditInput): Promise<void> {
  try {
    await writeAuditLog(input);
  } catch {
    // auditoria nunca derruba o fluxo principal
  }
}

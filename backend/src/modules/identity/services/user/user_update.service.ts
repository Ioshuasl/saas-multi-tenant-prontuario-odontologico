import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { Role } from '../../enum/role/role.enum.js';
import { assertCanChangeOwner } from '../../models/membership/last_owner.guard.js';
import {
  CountActiveOwnersRepository,
  GetByUserInTenantRepository,
  UpdateRepository,
} from '../../repositories/membership/membership.repository.js';
import { RevokeAllFamiliesRepository } from '../../repositories/refresh_token/refresh_token.repository.js';
import type { UserUpdateSchema } from '../../schemas/user.schema.js';
import type { MemberSummary } from '../../types/auth.types.js';

export class UpdateService {
  constructor(
    private readonly getByUser = new GetByUserInTenantRepository(),
    private readonly countOwners = new CountActiveOwnersRepository(),
    private readonly updateMembership = new UpdateRepository(),
    private readonly revokeAll = new RevokeAllFamiliesRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    userId: string,
    userSchema: UserUpdateSchema,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<MemberSummary> {
    const current = await this.getByUser.execute(ctx, userId);
    if (!current) {
      throw new AppError('NOT_FOUND', 'Membro não encontrado.', 404);
    }

    const nextRole = userSchema.role ?? current.role;
    const nextActive = userSchema.active ?? current.active;
    const ownerCount = await this.countOwners.execute(ctx);

    assertCanChangeOwner({
      isTargetOwner: current.role === Role.OWNER && current.active,
      activeOwnerCount: ownerCount,
      nextRole,
      nextActive,
    });

    const updated = await this.updateMembership.execute(ctx, current.id, {
      role: userSchema.role,
      active: userSchema.active,
      defaultUnitId: userSchema.defaultUnitId,
      permissions: userSchema.permissions,
    });

    if (userSchema.role && userSchema.role !== current.role) {
      await writeAuditLogSafe({
        tenantId: ctx.tenantId,
        actorId: ctx.userId,
        action: AuditAction.ROLE_CHANGED,
        resourceType: 'membership',
        resourceId: current.id,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: { from: current.role, to: userSchema.role, userId },
      });
    }

    if (userSchema.active === false && current.active) {
      await this.revokeAll.execute(userId);
      await writeAuditLogSafe({
        tenantId: ctx.tenantId,
        actorId: ctx.userId,
        action: AuditAction.MEMBER_DEACTIVATED,
        resourceType: 'membership',
        resourceId: current.id,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: { userId },
      });
    }

    return {
      id: updated.userId,
      membershipId: updated.id,
      email: updated.user?.email ?? '',
      name: updated.user?.name ?? '',
      role: updated.role,
      active: updated.active,
      defaultUnitId: updated.defaultUnitId ?? null,
      permissions: updated.permissions,
    };
  }
}

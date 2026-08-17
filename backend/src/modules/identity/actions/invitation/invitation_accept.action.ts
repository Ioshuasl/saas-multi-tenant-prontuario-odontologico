import { hashToken } from '../../../../shared/helpers/token_hash.js';
import { assertPasswordPolicy, hashPassword } from '../../../../shared/helpers/password.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { getPrismaClient } from '../../../../shared/database/tenant_prisma.js';
import { Role } from '../../enum/role/role.enum.js';
import { assertInvitationAcceptable } from '../../models/invitation/invitation.guard.js';
import { InvitationInvalidError } from '../../models/errors/invitation_invalid.error.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import {
  AcceptRepository,
  GetByTokenHashRepository,
} from '../../repositories/invitation/invitation.repository.js';
import {
  CreateRepository as CreateUserRepository,
  GetByEmailRepository,
} from '../../repositories/user/user.repository.js';
import {
  CreateRepository as CreateMembershipRepository,
  GetByUserTenantTxRepository,
} from '../../repositories/membership/membership.repository.js';
import type { InvitationAcceptSchema } from '../../schemas/invitation.schema.js';

export type AcceptActionResult = {
  userId: string;
  userEmail: string;
  userName: string;
  membershipId: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  role: string;
};

export class AcceptAction {
  constructor(
    private readonly getByTokenHash = new GetByTokenHashRepository(),
    private readonly getByEmail = new GetByEmailRepository(),
    private readonly createUser = new CreateUserRepository(),
    private readonly createMembership = new CreateMembershipRepository(),
    private readonly getMembershipInTx = new GetByUserTenantTxRepository(),
    private readonly acceptInvitation = new AcceptRepository(),
  ) {}

  async execute(invitationSchema: InvitationAcceptSchema): Promise<AcceptActionResult> {
    assertPasswordPolicy(invitationSchema.password);
    const tokenHash = hashToken(invitationSchema.token);
    const passwordHash = await hashPassword(invitationSchema.password);
    const prisma = getPrismaClient();

    return prisma.$transaction(async (tx) => {
      const invitation = await this.getByTokenHash.execute(tokenHash, tx);
      if (!invitation) {
        throw new InvitationInvalidError('not_found');
      }

      assertInvitationAcceptable(invitation);

      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${invitation.tenantId}, true)`;

      const email = invitation.email.toLowerCase();
      let user = await this.getByEmail.execute(email);

      if (!user) {
        const userId = idGenerator.next();
        await this.createUser.execute(
          {
            id: userId,
            email,
            name: invitationSchema.name,
            passwordHash,
          },
          tx,
        );
        user = {
          id: userId,
          email,
          name: invitationSchema.name,
          passwordHash,
          lastLoginAt: null,
          failedAttempts: 0,
          lockedUntil: null,
          platformRole: null,
        };
      }

      const existing = await this.getMembershipInTx.execute(tx, user.id, invitation.tenantId);
      if (existing) {
        throw new AppError(
          'DUPLICATE_RESOURCE',
          'Este e-mail já possui acesso a esta clínica.',
          409,
        );
      }

      const membershipId = idGenerator.next();
      await this.createMembership.execute(tx, {
        id: membershipId,
        tenantId: invitation.tenantId,
        userId: user.id,
        role: invitation.role || Role.RECEPTION,
      });

      await this.acceptInvitation.execute(tx, invitation.id);

      return {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        membershipId,
        tenantId: invitation.tenantId,
        tenantName: invitation.tenant?.name ?? '',
        tenantSlug: invitation.tenant?.slug ?? '',
        role: invitation.role,
      };
    });
  }
}

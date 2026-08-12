import { AcceptAction } from '../../actions/invitation/invitation_accept.action.js';
import type { InvitationAcceptSchema } from '../../schemas/invitation.schema.js';
import type { AuthSessionResult } from '../../types/auth.types.js';
import { IssueTokensService } from '../auth/auth_session.service.js';

export class AcceptService {
  constructor(
    private readonly acceptAction = new AcceptAction(),
    private readonly issueTokens = new IssueTokensService(),
  ) {}

  async execute(
    invitationSchema: InvitationAcceptSchema,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthSessionResult> {
    const accepted = await this.acceptAction.execute(invitationSchema);

    return this.issueTokens.execute({
      user: {
        id: accepted.userId,
        email: accepted.userEmail,
        name: accepted.userName,
      },
      membership: {
        id: accepted.membershipId,
        tenantId: accepted.tenantId,
        role: accepted.role,
        permissions: {},
        tenant: {
          id: accepted.tenantId,
          name: accepted.tenantName,
          slug: accepted.tenantSlug,
        },
      },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }
}

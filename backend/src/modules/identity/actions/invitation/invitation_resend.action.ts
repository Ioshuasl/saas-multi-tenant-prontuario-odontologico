import { randomBytes } from 'node:crypto';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { hashToken } from '../../../../shared/helpers/token_hash.js';
import { getEmailProvider } from '../../../../shared/integrations/email/index.js';
import { invitationEmailText } from '../../helpers/email_copy.helper.js';
import { addDays } from '../../helpers/slug.helper.js';
import { UpdateTokenRepository } from '../../repositories/invitation/invitation.repository.js';
import type { InvitationSummary } from '../../types/auth.types.js';

const INVITE_TTL_DAYS = 7;

export class ResendAction {
  constructor(
    private readonly updateToken = new UpdateTokenRepository(),
    private readonly email = getEmailProvider(),
  ) {}

  async execute(
    ctx: RequestContext,
    invitationId: string,
    email: string,
    role: string,
    clinicName: string,
  ): Promise<InvitationSummary> {
    const rawToken = randomBytes(32).toString('base64url');
    const row = await this.updateToken.execute(ctx, invitationId, {
      tokenHash: hashToken(rawToken),
      expiresAt: addDays(new Date(), INVITE_TTL_DAYS),
    });

    await this.email.send({
      to: email,
      subject: `Convite para ${clinicName}`,
      text: invitationEmailText({ clinicName, role, token: rawToken }),
    });

    return {
      id: row.id,
      email: row.email,
      role: row.role,
      expiresAt: row.expiresAt,
      acceptedAt: row.acceptedAt,
      revokedAt: row.revokedAt,
      createdAt: row.createdAt,
    };
  }
}

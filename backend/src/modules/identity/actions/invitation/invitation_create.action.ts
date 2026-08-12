import { randomBytes } from 'node:crypto';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { hashToken } from '../../../../shared/helpers/token_hash.js';
import { getEmailProvider } from '../../../../shared/integrations/email/index.js';
import { invitationEmailText } from '../../helpers/email_copy.helper.js';
import { addDays } from '../../helpers/slug.helper.js';
import { CreateRepository } from '../../repositories/invitation/invitation.repository.js';
import type { InvitationCreateSchema } from '../../schemas/invitation.schema.js';
import type { InvitationSummary } from '../../types/auth.types.js';

const INVITE_TTL_DAYS = 7;

export class CreateAction {
  constructor(
    private readonly createInvitation = new CreateRepository(),
    private readonly email = getEmailProvider(),
  ) {}

  async execute(
    ctx: RequestContext,
    invitationSchema: InvitationCreateSchema,
    clinicName: string,
  ): Promise<InvitationSummary> {
    const rawToken = randomBytes(32).toString('base64url');
    const row = await this.createInvitation.execute(ctx, {
      id: idGenerator.next(),
      email: invitationSchema.email.toLowerCase(),
      role: invitationSchema.role,
      tokenHash: hashToken(rawToken),
      invitedByUserId: ctx.userId,
      expiresAt: addDays(new Date(), INVITE_TTL_DAYS),
    });

    await this.email.send({
      to: row.email,
      subject: `Convite para ${clinicName}`,
      text: invitationEmailText({
        clinicName,
        role: row.role,
        token: rawToken,
      }),
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

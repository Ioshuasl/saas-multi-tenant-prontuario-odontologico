import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { InvitationInvalidError } from '../../models/errors/invitation_invalid.error.js';
import { ResendAction } from '../../actions/invitation/invitation_resend.action.js';
import { GetByIdRepository } from '../../repositories/invitation/invitation.repository.js';
import { GetByUserAndTenantRepository } from '../../repositories/membership/membership.repository.js';
import type { InvitationSummary } from '../../types/auth.types.js';

export class ResendService {
  constructor(
    private readonly getById = new GetByIdRepository(),
    private readonly getMembership = new GetByUserAndTenantRepository(),
    private readonly resendAction = new ResendAction(),
  ) {}

  async execute(ctx: RequestContext, invitationId: string): Promise<InvitationSummary> {
    const invitation = await this.getById.execute(ctx, invitationId);
    if (!invitation) {
      throw new AppError('NOT_FOUND', 'Convite não encontrado.', 404);
    }
    if (invitation.acceptedAt || invitation.revokedAt) {
      throw new InvitationInvalidError('reused');
    }

    const actor = await this.getMembership.execute(ctx.userId, ctx.tenantId);
    const clinicName = actor?.tenant.name ?? 'sua clínica';

    return this.resendAction.execute(
      ctx,
      invitationId,
      invitation.email,
      invitation.role,
      clinicName,
    );
  }
}

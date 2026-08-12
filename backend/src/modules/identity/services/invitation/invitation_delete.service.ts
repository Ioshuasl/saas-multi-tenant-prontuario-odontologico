import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { InvitationInvalidError } from '../../models/errors/invitation_invalid.error.js';
import {
  GetByIdRepository,
  RevokeRepository,
} from '../../repositories/invitation/invitation.repository.js';

export class DeleteService {
  constructor(
    private readonly getById = new GetByIdRepository(),
    private readonly revokeInvitation = new RevokeRepository(),
  ) {}

  async execute(ctx: RequestContext, invitationId: string): Promise<{ ok: true }> {
    const invitation = await this.getById.execute(ctx, invitationId);
    if (!invitation) {
      throw new AppError('NOT_FOUND', 'Convite não encontrado.', 404);
    }
    if (invitation.acceptedAt || invitation.revokedAt) {
      throw new InvitationInvalidError('reused');
    }

    await this.revokeInvitation.execute(ctx, invitationId);
    return { ok: true };
  }
}

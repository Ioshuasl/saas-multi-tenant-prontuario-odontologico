import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ListRepository } from '../../repositories/invitation/invitation.repository.js';
import type { InvitationSummary } from '../../types/auth.types.js';

export class ListService {
  constructor(private readonly listInvitations = new ListRepository()) {}

  async execute(ctx: RequestContext): Promise<InvitationSummary[]> {
    const rows = await this.listInvitations.execute(ctx);
    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      expiresAt: row.expiresAt,
      acceptedAt: row.acceptedAt,
      revokedAt: row.revokedAt,
      createdAt: row.createdAt,
    }));
  }
}

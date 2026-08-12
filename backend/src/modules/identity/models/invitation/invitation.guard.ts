import { InvitationInvalidError } from '../errors/invitation_invalid.error.js';

export function assertInvitationAcceptable(input: {
  acceptedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
  now?: Date;
}): void {
  if (input.acceptedAt || input.revokedAt) {
    throw new InvitationInvalidError('reused');
  }

  const now = input.now ?? new Date();
  if (input.expiresAt <= now) {
    throw new InvitationInvalidError('expired');
  }
}

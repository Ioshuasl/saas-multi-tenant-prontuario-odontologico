import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';

export class InvitationInvalidError extends AppError {
  constructor(kind: 'expired' | 'reused' | 'not_found' = 'not_found') {
    const message =
      kind === 'expired'
        ? 'Este convite expirou.'
        : kind === 'reused'
          ? 'Este convite já foi utilizado ou revogado.'
          : 'Convite inválido.';
    super('INVALID_STATE_TRANSITION', message, 409);
  }
}

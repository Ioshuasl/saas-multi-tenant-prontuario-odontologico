import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';

export class SupportAccessNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Concessão de suporte não encontrada.', 404);
    this.name = 'SupportAccessNotFoundError';
  }
}

export class SupportAccessTenantNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Tenant não encontrado.', 404);
    this.name = 'SupportAccessTenantNotFoundError';
  }
}

export class ReasonTooShortError extends AppError {
  constructor() {
    super('REASON_TOO_SHORT', 'O motivo deve ter pelo menos 20 caracteres.', 422);
    this.name = 'ReasonTooShortError';
  }
}

export class GrantWindowInvalidError extends AppError {
  constructor() {
    super('GRANT_WINDOW_INVALID', 'A janela de acesso deve ser de 1 a 4 horas.', 422);
    this.name = 'GrantWindowInvalidError';
  }
}

export class SelfApprovalForbiddenError extends AppError {
  constructor() {
    super('SELF_APPROVAL_FORBIDDEN', 'O solicitante não pode aprovar o próprio acesso.', 409);
    this.name = 'SelfApprovalForbiddenError';
  }
}

export class SupportAccessStatusInvalidError extends AppError {
  constructor() {
    super('GRANT_STATUS_INVALID', 'Esta concessão não está pendente de aprovação.', 422);
    this.name = 'SupportAccessStatusInvalidError';
  }
}

import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';

export class TenantExportNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Exportação não encontrada.', 404);
    this.name = 'TenantExportNotFoundError';
  }
}

export class IdempotencyKeyReusedError extends AppError {
  constructor() {
    super('IDEMPOTENCY_KEY_REUSED', 'Idempotency-Key já utilizada neste tenant.', 409);
    this.name = 'IdempotencyKeyReusedError';
  }
}

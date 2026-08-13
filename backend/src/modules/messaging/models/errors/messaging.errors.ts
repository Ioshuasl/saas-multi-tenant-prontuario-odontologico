import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';

export class AccountNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Conta WhatsApp não encontrada.', 404);
  }
}

export class AccountAlreadyConnectedError extends AppError {
  constructor() {
    super('DUPLICATE_RESOURCE', 'Já existe uma conta WhatsApp neste tenant.', 409);
  }
}

export class KillSwitchActiveError extends AppError {
  constructor() {
    super('BUSINESS_RULE_VIOLATION', 'Envio bloqueado pelo kill switch.', 422);
  }
}

export class WebhookSignatureInvalidError extends AppError {
  constructor() {
    super('UNAUTHENTICATED', 'Assinatura do webhook inválida.', 401);
  }
}

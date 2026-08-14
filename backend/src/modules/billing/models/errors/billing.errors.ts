import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';

export class InvalidInstallmentSplitError extends AppError {
  constructor(message = 'Parcelamento inválido.') {
    super('BUSINESS_RULE_VIOLATION', message, 422);
    this.name = 'InvalidInstallmentSplitError';
  }
}

export class ProceduresCategoryMissingError extends AppError {
  constructor() {
    super('BUSINESS_RULE_VIOLATION', 'Categoria financeira Procedimentos não encontrada.', 422);
    this.name = 'ProceduresCategoryMissingError';
  }
}

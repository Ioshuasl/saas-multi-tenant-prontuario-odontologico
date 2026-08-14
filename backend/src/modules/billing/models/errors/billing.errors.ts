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

export class ReceivableNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Título não encontrado.', 404);
    this.name = 'ReceivableNotFoundError';
  }
}

export class InstallmentNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Parcela não encontrada.', 404);
    this.name = 'InstallmentNotFoundError';
  }
}

export class PaymentNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Pagamento não encontrado.', 404);
    this.name = 'PaymentNotFoundError';
  }
}

export class PatientNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Paciente não encontrado.', 404);
    this.name = 'PatientNotFoundError';
  }
}

export class CategoryNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Categoria financeira não encontrada.', 404);
    this.name = 'CategoryNotFoundError';
  }
}

export class IdempotencyKeyRequiredError extends AppError {
  constructor() {
    super('VALIDATION_ERROR', 'Header Idempotency-Key é obrigatório.', 400);
    this.name = 'IdempotencyKeyRequiredError';
  }
}

export class IdempotencyKeyReusedError extends AppError {
  constructor() {
    super('IDEMPOTENCY_KEY_REUSED', 'Idempotency-Key já usada com outro payload.', 409);
    this.name = 'IdempotencyKeyReusedError';
  }
}

export class CashSessionRequiredError extends AppError {
  constructor() {
    super('CASH_SESSION_REQUIRED', 'Recebimento em dinheiro exige caixa aberto na unidade.', 422);
    this.name = 'CashSessionRequiredError';
  }
}

export class RecordImmutableError extends AppError {
  constructor(message = 'Registro imutável.') {
    super('RECORD_IMMUTABLE', message, 423);
    this.name = 'RecordImmutableError';
  }
}

export class ReceivableHasPaymentsError extends AppError {
  constructor() {
    super('RECEIVABLE_HAS_PAYMENTS', 'Título com pagamentos não estornados não pode ser cancelado.', 422);
    this.name = 'ReceivableHasPaymentsError';
  }
}

export class InstallmentNotPayableError extends AppError {
  constructor() {
    super('BUSINESS_RULE_VIOLATION', 'Parcela não admite baixa.', 422);
    this.name = 'InstallmentNotPayableError';
  }
}

export class PaymentAlreadyReversedError extends AppError {
  constructor() {
    super('BUSINESS_RULE_VIOLATION', 'Pagamento já estornado.', 422);
    this.name = 'PaymentAlreadyReversedError';
  }
}

export class SplitsSumMismatchError extends AppError {
  constructor() {
    super('BUSINESS_RULE_VIOLATION', 'A soma das formas deve igualar amountCents.', 422);
    this.name = 'SplitsSumMismatchError';
  }
}

export class InsufficientPatientCreditError extends AppError {
  constructor() {
    super('BUSINESS_RULE_VIOLATION', 'Crédito do paciente insuficiente.', 422);
    this.name = 'InsufficientPatientCreditError';
  }
}

export class ReverseReasonRequiredError extends AppError {
  constructor() {
    super('VALIDATION_ERROR', 'Informe o motivo do estorno (mínimo 10 caracteres).', 400);
    this.name = 'ReverseReasonRequiredError';
  }
}

export class ReceivableNotCancellableError extends AppError {
  constructor() {
    super('BUSINESS_RULE_VIOLATION', 'Título não pode ser cancelado neste status.', 422);
    this.name = 'ReceivableNotCancellableError';
  }
}

export class CategoryNotRevenueError extends AppError {
  constructor() {
    super('BUSINESS_RULE_VIOLATION', 'Título a receber exige categoria de receita.', 422);
    this.name = 'CategoryNotRevenueError';
  }
}

export class CashSessionNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Sessão de caixa não encontrada.', 404);
    this.name = 'CashSessionNotFoundError';
  }
}

export class CashSessionAlreadyOpenError extends AppError {
  constructor() {
    super('BUSINESS_RULE_VIOLATION', 'Já existe caixa aberto para este operador nesta unidade.', 422);
    this.name = 'CashSessionAlreadyOpenError';
  }
}

export class DifferenceReasonRequiredError extends AppError {
  constructor() {
    super('BUSINESS_RULE_VIOLATION', 'Diferença de caixa exige justificativa (mínimo 10 caracteres).', 422);
    this.name = 'DifferenceReasonRequiredError';
  }
}

export class OpeningByMethodMismatchError extends AppError {
  constructor() {
    super('BUSINESS_RULE_VIOLATION', 'A soma de openingByMethod deve igualar openingCents.', 422);
    this.name = 'OpeningByMethodMismatchError';
  }
}

export class UnitNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Unidade não encontrada.', 404);
    this.name = 'UnitNotFoundError';
  }
}

export class CategoryNotExpenseError extends AppError {
  constructor() {
    super('BUSINESS_RULE_VIOLATION', 'Contas a pagar exigem categoria de despesa.', 422);
    this.name = 'CategoryNotExpenseError';
  }
}

export class PayableNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Conta a pagar não encontrada.', 404);
    this.name = 'PayableNotFoundError';
  }
}

export class PayableNotOpenError extends AppError {
  constructor() {
    super('BUSINESS_RULE_VIOLATION', 'Só é possível alterar ou pagar conta em aberto.', 422);
    this.name = 'PayableNotOpenError';
  }
}

export class PayableAlreadyPaidError extends AppError {
  constructor() {
    super('BUSINESS_RULE_VIOLATION', 'Conta a pagar já liquidada.', 422);
    this.name = 'PayableAlreadyPaidError';
  }
}

export class PayableMethodNotAllowedError extends AppError {
  constructor() {
    super('BUSINESS_RULE_VIOLATION', 'Crédito do paciente não se aplica a contas a pagar.', 422);
    this.name = 'PayableMethodNotAllowedError';
  }
}

export class CategoryNameTakenError extends AppError {
  constructor() {
    super('CONFLICT', 'Já existe categoria com este nome e tipo.', 409);
    this.name = 'CategoryNameTakenError';
  }
}

export class ReceiptPdfPendingError extends AppError {
  constructor() {
    super('PDF_PENDING', 'PDF do recibo ainda não está disponível.', 409);
    this.name = 'ReceiptPdfPendingError';
  }
}

export class InstallmentNotChargeableError extends AppError {
  constructor() {
    super('BUSINESS_RULE_VIOLATION', 'Só é possível cobrar parcela vencida em aberto.', 422);
    this.name = 'InstallmentNotChargeableError';
  }
}

export class ProductionScopeForbiddenError extends AppError {
  constructor() {
    super('FORBIDDEN', 'Produção disponível somente para o próprio profissional.', 403);
    this.name = 'ProductionScopeForbiddenError';
  }
}


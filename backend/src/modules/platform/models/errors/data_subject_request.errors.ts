import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';

export class DataSubjectRequestNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Solicitação do titular não encontrada.', 404);
    this.name = 'DataSubjectRequestNotFoundError';
  }
}

export class DataSubjectRequestPatientNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Paciente não encontrado.', 404);
    this.name = 'DataSubjectRequestPatientNotFoundError';
  }
}

export class DataSubjectRequestStatusInvalidError extends AppError {
  constructor() {
    super('DSR_STATUS_INVALID', 'Transição de status não permitida para esta solicitação.', 422);
    this.name = 'DataSubjectRequestStatusInvalidError';
  }
}

import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import type { PatientDuplicateMatch } from '../../types/patients.types.js';

export class DuplicateCpfError extends AppError {
  constructor(match: PatientDuplicateMatch) {
    super(
      'DUPLICATE_RESOURCE',
      `Já existe paciente com este CPF (ficha #${match.code}).`,
      409,
      { existingPatientId: match.id, code: match.code, name: match.name },
    );
    this.name = 'DuplicateCpfError';
  }
}

export class InvalidCpfError extends AppError {
  constructor() {
    super('VALIDATION_ERROR', 'CPF inválido.', 400);
    this.name = 'InvalidCpfError';
  }
}

export class InvalidPatientNameError extends AppError {
  constructor() {
    super(
      'VALIDATION_ERROR',
      'Informe o nome completo (mínimo 2 palavras e 3 caracteres).',
      400,
    );
    this.name = 'InvalidPatientNameError';
  }
}

export class PatientNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Paciente não encontrado.', 404);
    this.name = 'PatientNotFoundError';
  }
}

export class ConfirmFutureAppointmentsError extends AppError {
  constructor(count: number) {
    super(
      'CONFIRMATION_REQUIRED',
      `Paciente possui ${count} agendamento(s) futuro(s). Confirme a inativação.`,
      409,
      { futureAppointmentCount: count, confirmQuery: 'confirmFutureAppointments=true' },
    );
    this.name = 'ConfirmFutureAppointmentsError';
  }
}

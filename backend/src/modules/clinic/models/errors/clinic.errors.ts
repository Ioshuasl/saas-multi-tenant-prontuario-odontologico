import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';

export class DuplicateCodeError extends AppError {
  constructor(code: string) {
    super('DUPLICATE_CODE', `Código de procedimento já existe: ${code}.`, 409);
    this.name = 'DuplicateCodeError';
  }
}

export class DuplicateNameError extends AppError {
  constructor(entity: string, name: string) {
    super('DUPLICATE_NAME', `${entity} com nome "${name}" já existe.`, 409);
    this.name = 'DuplicateNameError';
  }
}

export class HoursOverlapError extends AppError {
  constructor() {
    super('HOURS_OVERLAP', 'Intervalos de horário se sobrepõem no mesmo dia.', 422);
    this.name = 'HoursOverlapError';
  }
}

export class InvalidHoursError extends AppError {
  constructor(message: string) {
    super('INVALID_HOURS', message, 422);
    this.name = 'InvalidHoursError';
  }
}

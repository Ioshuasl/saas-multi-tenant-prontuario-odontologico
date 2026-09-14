import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';

export class PeriodTooLongError extends AppError {
  constructor(maxDays: number) {
    super(
      'PERIOD_TOO_LONG',
      `Período máximo de ${maxDays} dias. Reduza o intervalo da consulta.`,
      422,
    );
    this.name = 'PeriodTooLongError';
  }
}

export class PeriodInvalidError extends AppError {
  constructor() {
    super('PERIOD_INVALID', 'Data inicial não pode ser posterior à data final.', 422);
    this.name = 'PeriodInvalidError';
  }
}

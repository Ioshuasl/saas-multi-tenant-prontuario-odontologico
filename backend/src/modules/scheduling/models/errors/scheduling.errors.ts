import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';

export class SlotUnavailableError extends AppError {
  constructor(details: {
    conflictingAppointmentId?: string;
    suggestedSlots: string[];
  }) {
    super('SLOT_UNAVAILABLE', 'Este horário já está ocupado.', 409, [details]);
    this.name = 'SlotUnavailableError';
  }
}

export class InvalidStateTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(
      'INVALID_STATE_TRANSITION',
      `Transição de status inválida: ${from} → ${to}.`,
      409,
      { from, to },
    );
    this.name = 'InvalidStateTransitionError';
  }
}

export class AppointmentNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Agendamento não encontrado.', 404);
    this.name = 'AppointmentNotFoundError';
  }
}

export class CancelReasonRequiredError extends AppError {
  constructor() {
    super('VALIDATION_ERROR', 'Cancelamento exige motivo.', 400);
    this.name = 'CancelReasonRequiredError';
  }
}

export class NoShowTooEarlyError extends AppError {
  constructor() {
    super(
      'BUSINESS_RULE_VIOLATION',
      'Falta (NO_SHOW) só pode ser registrada após o horário de início.',
      422,
    );
    this.name = 'NoShowTooEarlyError';
  }
}

export class OutsideWorkingHoursError extends AppError {
  constructor() {
    super(
      'BUSINESS_RULE_VIOLATION',
      'Horário fora do expediente do profissional/unidade.',
      422,
    );
    this.name = 'OutsideWorkingHoursError';
  }
}

export class ScheduleBlockNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Bloqueio não encontrado.', 404);
    this.name = 'ScheduleBlockNotFoundError';
  }
}

export class AppointmentSeriesNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Série de agendamentos não encontrada.', 404);
    this.name = 'AppointmentSeriesNotFoundError';
  }
}

export class UnsupportedRruleError extends AppError {
  constructor(message = 'RRULE não suportado. Use FREQ=DAILY|WEEKLY|MONTHLY com INTERVAL.') {
    super('VALIDATION_ERROR', message, 400);
    this.name = 'UnsupportedRruleError';
  }
}

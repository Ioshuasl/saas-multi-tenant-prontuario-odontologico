import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';

export class LastOwnerError extends AppError {
  constructor() {
    super(
      'BUSINESS_RULE_VIOLATION',
      'O último Owner da clínica não pode ser removido nem rebaixado.',
      422,
    );
  }
}

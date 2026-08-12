import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';

export class DuplicateEmailError extends AppError {
  constructor() {
    super('DUPLICATE_RESOURCE', 'E-mail já cadastrado.', 409);
  }
}

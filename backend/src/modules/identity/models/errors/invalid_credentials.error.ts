import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';

export class InvalidCredentialsError extends AppError {
  constructor() {
    super('UNAUTHENTICATED', 'Credenciais inválidas.', 401);
  }
}

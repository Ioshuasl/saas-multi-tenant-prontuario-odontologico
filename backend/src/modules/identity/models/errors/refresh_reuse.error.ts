import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';

export class RefreshReuseError extends AppError {
  constructor() {
    super('UNAUTHENTICATED', 'Sessão inválida. Faça login novamente.', 401);
  }
}

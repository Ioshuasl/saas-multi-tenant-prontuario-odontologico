import type { NextFunction, Request, Response } from 'express';
import { isPlatformOperator } from '../../modules/identity/identity_public.js';
import { AppError } from './error_handler.middleware.js';

export async function requirePlatformOperator(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.auth) {
    next(new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401));
    return;
  }
  const allowed = await isPlatformOperator(req.auth.userId);
  if (!allowed) {
    next(new AppError('FORBIDDEN', 'Operação restrita a operadores da plataforma.', 403));
    return;
  }
  next();
}

import { Router } from 'express';
import { healthRoutes } from './health.routes.js';

/** Monta rotas versionadas em `/api/v1`. Módulos de domínio entram aqui. */
export function buildApiRouter(): Router {
  const api = Router();
  api.use(healthRoutes);
  return api;
}

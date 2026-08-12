import { Router } from 'express';
import { buildIdentityRouter } from '../modules/identity/identity.module.js';
import { buildClinicRouter } from '../modules/clinic/clinic.module.js';
import { healthRoutes } from './health.routes.js';

/** Monta rotas versionadas em `/api/v1`. Módulos de domínio entram aqui. */
export function buildApiRouter(): Router {
  const api = Router();
  api.use(healthRoutes);
  api.use(buildIdentityRouter());
  api.use(buildClinicRouter());
  return api;
}

import { Router } from 'express';
import { buildClinicRoutes } from './routes/v1/clinic.routes.js';
import { buildProcedureRoutes } from './routes/v1/procedure.routes.js';

export function buildClinicRouter(): Router {
  const router = Router();
  router.use('/clinic', buildClinicRoutes());
  router.use('/procedures', buildProcedureRoutes());
  return router;
}

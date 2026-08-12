import { Router } from 'express';
import { buildPatientRoutes } from './routes/v1/patient.routes.js';

export function buildPatientsRouter(): Router {
  const router = Router();
  router.use('/patients', buildPatientRoutes());
  return router;
}

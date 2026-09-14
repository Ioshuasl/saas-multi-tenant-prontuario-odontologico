import { Router } from 'express';
import { buildAuditRoutes } from './routes/v1/audit.routes.js';
import { buildInternalSupportRoutes } from './routes/v1/internal_support.routes.js';
import { buildPrivacyRoutes } from './routes/v1/privacy.routes.js';
import { buildReadyRoutes } from './routes/v1/ready.routes.js';

export function buildPlatformRouter(): Router {
  const router = Router();
  router.use(buildReadyRoutes());
  router.use(buildAuditRoutes());
  router.use(buildPrivacyRoutes());
  router.use(buildInternalSupportRoutes());
  return router;
}

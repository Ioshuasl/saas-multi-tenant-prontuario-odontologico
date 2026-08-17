import { Router } from 'express';
import { buildSubscriptionRoutes } from './routes/v1/subscription.routes.js';

export function buildSubscriptionRouter(): Router {
  const router = Router();
  router.use('/subscription', buildSubscriptionRoutes());
  return router;
}

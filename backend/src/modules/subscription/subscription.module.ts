import { Router } from 'express';
import { buildSubscriptionRoutes } from './routes/v1/subscription.routes.js';

/** Bounded context subscription (E10) — trial, planos, limites, cobrança manual. */
export function buildSubscriptionRouter(): Router {
  const router = Router();
  router.use('/subscription', buildSubscriptionRoutes());
  return router;
}

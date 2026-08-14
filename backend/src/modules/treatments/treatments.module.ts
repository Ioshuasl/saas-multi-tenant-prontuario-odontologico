import { Router } from 'express';
import { buildQuoteRoutes } from './routes/v1/quote.routes.js';
import { buildPublicQuoteRoutes } from './routes/v1/public_quote.routes.js';
import { buildTreatmentPlanRoutes } from './routes/v1/treatment_plan.routes.js';
import { buildTreatmentItemRoutes } from './routes/v1/treatment_item.routes.js';

export function buildTreatmentsRouter(): Router {
  const router = Router();
  router.use('/quotes', buildQuoteRoutes());
  router.use('/treatment-plans', buildTreatmentPlanRoutes());
  router.use('/treatment-items', buildTreatmentItemRoutes());
  return router;
}

export function buildPublicQuotesRouter(): Router {
  return buildPublicQuoteRoutes();
}

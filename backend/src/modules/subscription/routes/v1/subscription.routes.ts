import { Router, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { authenticateMiddleware } from '../../../../shared/middlewares/authenticate.middleware.js';
import { authorize } from '../../../../shared/middlewares/authorize.middleware.js';
import { tenantContextMiddleware } from '../../../../shared/middlewares/tenant_context.middleware.js';
import { SubscriptionController } from '../../controllers/subscription.controller.js';
import { asyncSubscriptionGuard } from '../../middlewares/subscription_guard.middleware.js';

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}

const readStack: RequestHandler[] = [
  asyncHandler(authenticateMiddleware),
  tenantContextMiddleware,
  asyncSubscriptionGuard(),
  authorize('subscription.manage'),
];

const ownerReadStack: RequestHandler[] = [
  asyncHandler(authenticateMiddleware),
  tenantContextMiddleware,
  asyncSubscriptionGuard(),
  authorize('subscription.manage'),
];

/** Ops: OWNER da clínica alvo com subscription.manage (piloto manual). */
const opsStack: RequestHandler[] = [
  asyncHandler(authenticateMiddleware),
  tenantContextMiddleware,
  authorize('subscription.manage'),
];

export function buildSubscriptionRoutes(): Router {
  const router = Router();
  const controller = new SubscriptionController();

  router.get('/', ...ownerReadStack, asyncHandler(controller.get));
  router.get('/plans', ...readStack, asyncHandler(controller.listPlans));
  router.get('/usage', ...ownerReadStack, asyncHandler(controller.getUsage));
  router.post('/checkout', ...ownerReadStack, asyncHandler(controller.checkout));
  router.post('/ops/status', ...opsStack, asyncHandler(controller.opsUpdateStatus));

  return router;
}

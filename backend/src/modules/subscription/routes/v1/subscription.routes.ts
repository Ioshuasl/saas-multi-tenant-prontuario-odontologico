import { Router, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { authenticateMiddleware } from '../../../../shared/middlewares/authenticate.middleware.js';
import { authorize } from '../../../../shared/middlewares/authorize.middleware.js';
import { tenantContextMiddleware } from '../../../../shared/middlewares/tenant_context.middleware.js';
import { SubscriptionController } from '../../controllers/subscription.controller.js';

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}

const ownerStack: RequestHandler[] = [
  asyncHandler(authenticateMiddleware),
  tenantContextMiddleware,
  authorize('subscription.manage'),
];

export function buildSubscriptionRoutes(): Router {
  const router = Router();
  const controller = new SubscriptionController();
  router.get('/plans', ...ownerStack, asyncHandler(controller.listPlansHandler));
  router.get('/usage', ...ownerStack, asyncHandler(controller.getUsage));
  router.post('/checkout', ...ownerStack, asyncHandler(controller.checkout));
  router.get('/', ...ownerStack, asyncHandler(controller.getSubscription));
  return router;
}

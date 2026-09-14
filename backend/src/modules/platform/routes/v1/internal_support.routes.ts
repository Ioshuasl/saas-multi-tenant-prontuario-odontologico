import { Router, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { authenticateMiddleware } from '../../../../shared/middlewares/authenticate.middleware.js';
import { requirePlatformOperator } from '../../../../shared/middlewares/require_platform_operator.middleware.js';
import { SupportAccessController } from '../../controllers/support_access.controller.js';

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}

const operatorStack: RequestHandler[] = [
  asyncHandler(authenticateMiddleware),
  asyncHandler(requirePlatformOperator),
];

export function buildInternalSupportRoutes(): Router {
  const router = Router();
  const grants = new SupportAccessController();

  router.post('/internal/support-access', ...operatorStack, asyncHandler(grants.create));
  router.get('/internal/support-access/:id', ...operatorStack, asyncHandler(grants.get));
  router.post('/internal/support-access/:id/approve', ...operatorStack, asyncHandler(grants.approve));
  return router;
}

import { Router, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { authenticateMiddleware } from '../../../../shared/middlewares/authenticate.middleware.js';
import { authorize } from '../../../../shared/middlewares/authorize.middleware.js';
import { tenantContextMiddleware } from '../../../../shared/middlewares/tenant_context.middleware.js';
import { DataSubjectRequestController } from '../../controllers/data_subject_request.controller.js';
import { TenantExportController } from '../../controllers/tenant_export.controller.js';

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}

const privacyStack: RequestHandler[] = [
  asyncHandler(authenticateMiddleware),
  tenantContextMiddleware,
  authorize('data.export'),
];

export function buildPrivacyRoutes(): Router {
  const router = Router();
  const exports = new TenantExportController();
  const dsr = new DataSubjectRequestController();

  router.get('/privacy/data-subject-requests', ...privacyStack, asyncHandler(dsr.list));
  router.post('/privacy/data-subject-requests', ...privacyStack, asyncHandler(dsr.create));
  router.get('/privacy/data-subject-requests/:id', ...privacyStack, asyncHandler(dsr.get));
  router.patch('/privacy/data-subject-requests/:id', ...privacyStack, asyncHandler(dsr.update));

  router.post('/privacy/exports', ...privacyStack, asyncHandler(exports.create));
  router.get('/privacy/exports/:id', ...privacyStack, asyncHandler(exports.get));
  return router;
}

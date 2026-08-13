import { Router, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { clientIp, rateLimit } from '../../../../shared/middlewares/rate_limit.middleware.js';
import { PublicAnamnesisController } from '../../controllers/public_anamnesis.controller.js';

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}

export function buildPublicAnamnesisRoutes(): Router {
  const router = Router();
  const controller = new PublicAnamnesisController();
  const limit = rateLimit({
    windowMs: 60 * 60_000,
    max: 30,
    key: (req) => `public:anamnesis:ip:${clientIp(req)}`,
  });

  router.get('/anamnesis/:token', limit, asyncHandler(controller.get));
  router.post('/anamnesis/:token', limit, asyncHandler(controller.submit));

  return router;
}

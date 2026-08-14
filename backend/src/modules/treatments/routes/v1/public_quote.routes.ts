import { Router, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { clientIp, rateLimit } from '../../../../shared/middlewares/rate_limit.middleware.js';
import { PublicQuoteController } from '../../controllers/public_quote.controller.js';

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}

export function buildPublicQuoteRoutes(): Router {
  const router = Router();
  const controller = new PublicQuoteController();
  const limit = rateLimit({
    windowMs: 60 * 60_000,
    max: 30,
    key: (req) => `public:quotes:ip:${clientIp(req)}`,
  });

  router.get('/quotes/:token', limit, asyncHandler(controller.get));
  router.post('/quotes/:token/decision', limit, asyncHandler(controller.decide));

  return router;
}

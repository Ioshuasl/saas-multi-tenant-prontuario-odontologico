import { Router, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { clientIp, rateLimit } from '../../../../shared/middlewares/rate_limit.middleware.js';
import { WhatsappWebhookController } from '../../controllers/whatsapp_webhook.controller.js';

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}

export function buildWhatsappWebhookRoutes(): Router {
  const router = Router();
  const controller = new WhatsappWebhookController();
  const limit = rateLimit({
    windowMs: 60_000,
    max: 120,
    key: (req) => `wa-webhook:${clientIp(req)}`,
  });

  router.post('/', limit, asyncHandler(controller.receive));
  return router;
}

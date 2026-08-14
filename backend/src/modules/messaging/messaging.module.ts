import { Router } from 'express';
import { buildMessagingRoutes } from './routes/v1/messaging.routes.js';
import { buildWhatsappWebhookRoutes } from './routes/v1/whatsapp_webhook.routes.js';

export function buildMessagingRouter(): Router {
  const router = Router();
  router.use('/messaging', buildMessagingRoutes());
  return router;
}

export function buildWhatsappWebhookRouter(): Router {
  return buildWhatsappWebhookRoutes();
}

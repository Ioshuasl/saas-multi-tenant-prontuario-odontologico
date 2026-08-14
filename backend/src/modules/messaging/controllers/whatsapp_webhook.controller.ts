import type { Request, Response } from 'express';
import { wahaHmacKey } from '../../../shared/config/env.js';
import { logger } from '../../../shared/config/logger.js';
import { RedisUnavailableError } from '../../../shared/queue/job_queue.port.js';
import { getJobQueue } from '../../../shared/queue/job_queue_singleton.js';
import { JOB, QUEUE } from '../../../shared/queue/queue_names.js';
import { WebhookSignatureInvalidError } from '../models/errors/messaging.errors.js';
import { ResolveAccountBySessionNameRepository } from '../repositories/whatsapp_account/whatsapp_account.repository.js';
import { parseWhatsappWebhook, verifyWahaHmac } from '../helpers/webhook.helper.js';

const resolveAccount = new ResolveAccountBySessionNameRepository();

export class WhatsappWebhookController {
  receive = async (req: Request, res: Response): Promise<void> => {
    const raw = req.rawBody;
    if (!raw || !verifyWahaHmac(raw, req.header('x-webhook-hmac'), wahaHmacKey())) {
      throw new WebhookSignatureInvalidError();
    }

    const parsed = parseWhatsappWebhook(req.body);
    const sessionName = parsed.sessionName;
    const jobId = parsed.firstWamid ?? (sessionName ? `session:${sessionName}:${parsed.session?.status ?? 'evt'}` : null);
    if (!sessionName || !jobId) {
      res.status(200).json({ data: { ok: true, skipped: true } });
      return;
    }

    const account = await resolveAccount.execute(sessionName);
    if (!account) {
      res.status(200).json({ data: { ok: true, unknown: true } });
      return;
    }

    const queue = getJobQueue();
    if (!queue.isConnected()) {
      await queue.tryConnect();
    }
    try {
      await queue.add(
        QUEUE.messaging,
        JOB.processWhatsappWebhook,
        {
          tenantId: account.tenantId,
          requestId: req.requestId,
          wamid: jobId,
          webhook: req.body,
        },
        { jobId },
      );
    } catch (err) {
      if (err instanceof RedisUnavailableError) {
        logger.warn({ jobId, tenantId: account.tenantId }, 'webhook_enqueue_redis_unavailable');
        res.status(503).json({
          error: { code: 'PROVIDER_UNAVAILABLE', message: 'Fila indisponível. Tente novamente.', requestId: req.requestId },
        });
        return;
      }
      throw err;
    }

    res.status(200).json({ data: { ok: true } });
  };
}

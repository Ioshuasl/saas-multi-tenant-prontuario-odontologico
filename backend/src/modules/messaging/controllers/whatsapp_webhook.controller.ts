import type { Request, Response } from 'express';
import { env } from '../../../shared/config/env.js';
import { logger } from '../../../shared/config/logger.js';
import { RedisUnavailableError } from '../../../shared/queue/job_queue.port.js';
import { getJobQueue } from '../../../shared/queue/job_queue_singleton.js';
import { JOB, QUEUE } from '../../../shared/queue/queue_names.js';
import { WebhookSignatureInvalidError } from '../models/errors/messaging.errors.js';
import { ResolveAccountByPhoneNumberIdRepository } from '../repositories/whatsapp_account/whatsapp_account.repository.js';
import { parseWhatsappWebhook, verifyHubSignature } from '../helpers/webhook.helper.js';

const resolveAccount = new ResolveAccountByPhoneNumberIdRepository();

export class WhatsappWebhookController {
  handshake = async (req: Request, res: Response): Promise<void> => {
    const mode = typeof req.query['hub.mode'] === 'string' ? req.query['hub.mode'] : '';
    const token = typeof req.query['hub.verify_token'] === 'string' ? req.query['hub.verify_token'] : '';
    const challenge = typeof req.query['hub.challenge'] === 'string' ? req.query['hub.challenge'] : '';
    if (mode !== 'subscribe' || token !== env.WHATSAPP_VERIFY_TOKEN || !challenge) {
      res.status(403).send('Forbidden');
      return;
    }
    res.status(200).type('text/plain').send(challenge);
  };

  receive = async (req: Request, res: Response): Promise<void> => {
    const raw = req.rawBody;
    if (!raw || !verifyHubSignature(raw, req.header('x-hub-signature-256'), env.WHATSAPP_APP_SECRET)) {
      throw new WebhookSignatureInvalidError();
    }

    const parsed = parseWhatsappWebhook(req.body);
    const phoneNumberId = parsed.phoneNumberId;
    const wamid = parsed.firstWamid;
    if (!phoneNumberId || !wamid) {
      res.status(200).json({ data: { ok: true, skipped: true } });
      return;
    }

    const account = await resolveAccount.execute(phoneNumberId);
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
          wamid,
          webhook: req.body,
        },
        { jobId: wamid },
      );
    } catch (err) {
      if (err instanceof RedisUnavailableError) {
        logger.warn({ wamid, tenantId: account.tenantId }, 'webhook_enqueue_redis_unavailable');
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

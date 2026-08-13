import { createServer, type Server } from 'node:http';
import { env } from './shared/config/env.js';
import { logger } from './shared/config/logger.js';
import { OutboxDispatcher } from './shared/database/outbox_dispatcher.js';
import { getPrismaClient } from './shared/database/tenant_prisma.js';
import { scheduleAppointmentNotificationsJob } from './modules/scheduling/jobs/schedule_appointment_notifications.job.js';
import { offerWaitlistSlotJob } from './modules/scheduling/jobs/offer_waitlist_slot.job.js';
import { sendWhatsappMessageJob } from './modules/messaging/jobs/send_whatsapp_message.job.js';
import { processWhatsappWebhookJob } from './modules/messaging/jobs/process_whatsapp_webhook.job.js';
import { ensureMedicalRecordJob } from './modules/clinical_records/jobs/ensure_medical_record.job.js';
import { generateAttachmentThumbnailJob } from './modules/clinical_records/jobs/generate_attachment_thumbnail.job.js';
import { BullmqJobQueue } from './shared/queue/bullmq_job_queue.js';
import { setJobQueue } from './shared/queue/job_queue_singleton.js';
import type { JobPayload } from './shared/queue/job_payload.js';
import { JOB, QUEUE } from './shared/queue/queue_names.js';

const DISPATCH_INTERVAL_MS = 5_000;

async function main(): Promise<void> {
  logger.info('worker_starting');

  const queue = new BullmqJobQueue();
  setJobQueue(queue);
  queue.register(QUEUE.platform, JOB.ensureMedicalRecord, ensureMedicalRecordJob);
  queue.register(QUEUE.platform, JOB.generateAttachmentThumbnail, generateAttachmentThumbnailJob);
  queue.register(QUEUE.platform, JOB.smokePing, async (payload: JobPayload) => {
    logger.info(
      { tenantId: payload.tenantId, requestId: payload.requestId, eventId: payload.eventId },
      'smoke_ping_processed',
    );
  });
  queue.register(QUEUE.scheduling, JOB.scheduleAppointmentNotifications, scheduleAppointmentNotificationsJob);
  queue.register(QUEUE.messaging, JOB.sendWhatsappMessage, sendWhatsappMessageJob);
  queue.register(QUEUE.messaging, JOB.processWhatsappWebhook, processWhatsappWebhookJob);
  queue.register(QUEUE.scheduling, JOB.offerWaitlistSlot, async (payload: JobPayload) => {
    await offerWaitlistSlotJob(payload, async (next, delayMs) => {
      await queue.add(QUEUE.scheduling, JOB.offerWaitlistSlot, next, {
        jobId: `offer-waitlist:${String(next.appointmentId)}:${String(next.batch)}`,
        delayMs,
      });
    });
  });

  let redisOk = await queue.tryConnect();
  if (redisOk) {
    await queue.startWorkers();
    logger.info('worker_redis_connected');
  } else {
    logger.warn('worker_redis_unavailable');
  }

  const dispatcher = new OutboxDispatcher(queue);

  const tick = async (): Promise<void> => {
    try {
      const n = await dispatcher.dispatchOnce();
      if (n > 0) logger.info({ dispatched: n }, 'outbox_dispatched');
    } catch (err) {
      logger.error({ err }, 'outbox_dispatch_error');
    }

    if (!queue.isConnected()) {
      redisOk = await queue.tryConnect();
      if (redisOk) {
        await queue.startWorkers();
        logger.info('worker_redis_reconnected');
      }
    }
  };

  const interval = setInterval(() => {
    void tick();
  }, DISPATCH_INTERVAL_MS);
  void tick();

  const health = startWorkerHealth(() => ({
    status: 'ok',
    service: 'worker',
    redis: queue.isConnected() ? 'up' : 'down',
  }));

  const shutdown = async (): Promise<void> => {
    clearInterval(interval);
    health.close();
    await queue.close();
    await getPrismaClient().$disconnect();
    logger.info('worker_stopped');
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

function startWorkerHealth(getStatus: () => Record<string, string>): Server {
  const server = createServer((req, res) => {
    if (req.url === '/health' || req.url === '/api/v1/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ data: getStatus() }));
      return;
    }
    res.writeHead(404).end();
  });

  server.on('error', (err) => {
    logger.warn({ err, port: env.WORKER_HEALTH_PORT }, 'worker_health_bind_failed');
  });

  server.listen(env.WORKER_HEALTH_PORT, () => {
    logger.info({ port: env.WORKER_HEALTH_PORT }, 'worker_health_listening');
  });

  return server;
}

void main().catch((err) => {
  logger.error({ err }, 'worker_bootstrap_failed');
  process.exit(1);
});

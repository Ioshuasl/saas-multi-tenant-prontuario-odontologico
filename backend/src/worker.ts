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
import { generateQuotePdfJob } from './modules/treatments/jobs/generate_quote_pdf.job.js';
import { expireQuotesJob } from './modules/treatments/jobs/expire_quotes.job.js';
import { markOverdueInstallmentsJob } from './modules/billing/jobs/mark_overdue_installments.job.js';
import { generateReceiptPdfJob } from './modules/billing/jobs/generate_receipt_pdf.job.js';
import { reportExportJob } from './modules/reporting/jobs/report_export.job.js';
import {
  expireTrialsJob,
  recalculateUsageCountersJob,
} from './modules/subscription/jobs/subscription_lifecycle.job.js';
import { listTenantsForScheduledJobs } from './modules/clinic/clinic_public.js';
import { todayInTimezone } from './modules/treatments/helpers/quote_valid_until.helper.js';
import { hourInTimezone } from './modules/billing/helpers/civil_date.helper.js';
import { BullmqJobQueue } from './shared/queue/bullmq_job_queue.js';
import { setJobQueue } from './shared/queue/job_queue_singleton.js';
import type { JobPayload } from './shared/queue/job_payload.js';
import { JOB, QUEUE } from './shared/queue/queue_names.js';

const DISPATCH_INTERVAL_MS = 5_000;
const EXPIRE_QUOTES_INTERVAL_MS = 15 * 60_000;
const MARK_OVERDUE_INTERVAL_MS = 15 * 60_000;
const SUBSCRIPTION_INTERVAL_MS = 15 * 60_000;

async function enqueueMarkOverdue(queue: BullmqJobQueue): Promise<void> {
  if (!queue.isConnected()) return;
  const tenants = await listTenantsForScheduledJobs();
  for (const tenant of tenants) {
    if (hourInTimezone(tenant.timezone) < 3) continue;
    const ymd = todayInTimezone(tenant.timezone);
    await queue.add(
      QUEUE.billing,
      JOB.markOverdueInstallments,
      { tenantId: tenant.id, requestId: `mark-overdue:${ymd}` },
      { jobId: `mark-overdue:${tenant.id}:${ymd}` },
    );
  }
}

async function enqueueSubscriptionLifecycle(queue: BullmqJobQueue): Promise<void> {
  if (!queue.isConnected()) return;
  const tenants = await listTenantsForScheduledJobs();
  for (const tenant of tenants) {
    const ymd = todayInTimezone(tenant.timezone);
    await queue.add(
      QUEUE.platform,
      JOB.expireTrials,
      { tenantId: tenant.id, requestId: `expire-trials:${ymd}` },
      { jobId: `expire-trials:${tenant.id}:${ymd}` },
    );
    await queue.add(
      QUEUE.platform,
      JOB.recalculateUsageCounters,
      { tenantId: tenant.id, requestId: `usage-recalc:${ymd}` },
      { jobId: `usage-recalc:${tenant.id}:${ymd}` },
    );
  }
}

async function enqueueExpireQuotes(queue: BullmqJobQueue): Promise<void> {
  if (!queue.isConnected()) return;
  const tenants = await listTenantsForScheduledJobs();
  for (const tenant of tenants) {
    const ymd = todayInTimezone(tenant.timezone);
    await queue.add(
      QUEUE.platform,
      JOB.expireQuotes,
      { tenantId: tenant.id, requestId: `expire-quotes:${ymd}` },
      { jobId: `expire-quotes:${tenant.id}:${ymd}` },
    );
  }
}

async function main(): Promise<void> {
  logger.info('worker_starting');

  const queue = new BullmqJobQueue();
  setJobQueue(queue);
  queue.register(QUEUE.platform, JOB.ensureMedicalRecord, ensureMedicalRecordJob);
  queue.register(QUEUE.platform, JOB.generateAttachmentThumbnail, generateAttachmentThumbnailJob);
  queue.register(QUEUE.platform, JOB.generateQuotePdf, generateQuotePdfJob);
  queue.register(QUEUE.reporting, JOB.generateExport, reportExportJob);
  queue.register(QUEUE.platform, JOB.expireTrials, expireTrialsJob);
  queue.register(QUEUE.platform, JOB.recalculateUsageCounters, recalculateUsageCountersJob);
  queue.register(QUEUE.platform, JOB.generateReceiptPdf, generateReceiptPdfJob);
  queue.register(QUEUE.platform, JOB.expireQuotes, expireQuotesJob);
  queue.register(QUEUE.billing, JOB.markOverdueInstallments, markOverdueInstallmentsJob);
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

  const expireInterval = setInterval(() => {
    void enqueueExpireQuotes(queue).catch((err) => {
      logger.error({ err }, 'expire_quotes_enqueue_error');
    });
  }, EXPIRE_QUOTES_INTERVAL_MS);
  void enqueueExpireQuotes(queue).catch((err) => {
    logger.error({ err }, 'expire_quotes_enqueue_error');
  });

  const overdueInterval = setInterval(() => {
    void enqueueMarkOverdue(queue).catch((err) => {
      logger.error({ err }, 'mark_overdue_enqueue_error');
    });
  }, MARK_OVERDUE_INTERVAL_MS);
  void enqueueMarkOverdue(queue).catch((err) => {
    logger.error({ err }, 'mark_overdue_enqueue_error');
  });

  const subscriptionInterval = setInterval(() => {
    void enqueueSubscriptionLifecycle(queue).catch((err) => {
      logger.error({ err }, 'subscription_lifecycle_enqueue_error');
    });
  }, SUBSCRIPTION_INTERVAL_MS);
  void enqueueSubscriptionLifecycle(queue).catch((err) => {
    logger.error({ err }, 'subscription_lifecycle_enqueue_error');
  });

  const health = startWorkerHealth(() => ({
    status: 'ok',
    service: 'worker',
    redis: queue.isConnected() ? 'up' : 'down',
  }));

  const shutdown = async (): Promise<void> => {
    clearInterval(interval);
    clearInterval(expireInterval);
    clearInterval(overdueInterval);
    clearInterval(subscriptionInterval);
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

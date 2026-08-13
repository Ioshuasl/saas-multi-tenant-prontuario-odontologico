/** Filas e jobs do MVP — docs/11 §7. */

export const QUEUE = {
  messaging: 'messaging',
  scheduling: 'scheduling',
  billing: 'billing',
  reporting: 'reporting',
  platform: 'platform',
} as const;

export type QueueName = (typeof QUEUE)[keyof typeof QUEUE];

export const JOB = {
  sendWhatsappMessage: 'send-whatsapp-message',
  processWhatsappWebhook: 'process-whatsapp-webhook',
  scheduleAppointmentNotifications: 'schedule-appointment-notifications',
  offerWaitlistSlot: 'offer-waitlist-slot',
  markOverdueInstallments: 'mark-overdue-installments',
  generateExport: 'generate-export',
  cleanupExpiredTokens: 'cleanup-expired-tokens',
  recalculateUsageCounters: 'recalculate-usage-counters',
  smokePing: 'smoke-ping',
} as const;

export type JobName = (typeof JOB)[keyof typeof JOB];

export type JobRetry = {
  attempts: number;
  backoff: { type: 'exponential'; delay: number };
};

export const JOB_RETRY: Record<JobName, JobRetry> = {
  [JOB.sendWhatsappMessage]: { attempts: 5, backoff: { type: 'exponential', delay: 30_000 } },
  [JOB.processWhatsappWebhook]: { attempts: 3, backoff: { type: 'exponential', delay: 5_000 } },
  [JOB.scheduleAppointmentNotifications]: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5_000 },
  },
  [JOB.offerWaitlistSlot]: { attempts: 3, backoff: { type: 'exponential', delay: 5_000 } },
  [JOB.markOverdueInstallments]: { attempts: 3, backoff: { type: 'exponential', delay: 5_000 } },
  [JOB.generateExport]: { attempts: 2, backoff: { type: 'exponential', delay: 5_000 } },
  [JOB.cleanupExpiredTokens]: { attempts: 3, backoff: { type: 'exponential', delay: 5_000 } },
  [JOB.recalculateUsageCounters]: { attempts: 3, backoff: { type: 'exponential', delay: 5_000 } },
  [JOB.smokePing]: { attempts: 3, backoff: { type: 'exponential', delay: 1_000 } },
};

export function dlqName(queue: QueueName): string {
  return `${queue}-dlq`;
}

import type { JobName, QueueName } from './queue_names.js';
import { JOB, QUEUE } from './queue_names.js';

export type OutboxRoute = {
  queue: QueueName;
  job: JobName;
};

export type OutboxRouteTarget = OutboxRoute | OutboxRoute[] | 'emit-only';

/**
 * Evento de domínio → fila/job. `emit-only` = persiste o evento sem worker (reporting depois).
 */
export const OUTBOX_ROUTES: Record<string, OutboxRouteTarget> = {
  'platform.smoke_ping': { queue: QUEUE.platform, job: JOB.smokePing },
  'patients.patient_created': { queue: QUEUE.platform, job: JOB.ensureMedicalRecord },
  'scheduling.appointment_scheduled': {
    queue: QUEUE.scheduling,
    job: JOB.scheduleAppointmentNotifications,
  },
  'scheduling.appointment_confirmed': {
    queue: QUEUE.scheduling,
    job: JOB.scheduleAppointmentNotifications,
  },
  'scheduling.appointment_rescheduled': {
    queue: QUEUE.scheduling,
    job: JOB.scheduleAppointmentNotifications,
  },
  'scheduling.appointment_cancelled': [
    { queue: QUEUE.scheduling, job: JOB.offerWaitlistSlot },
    { queue: QUEUE.scheduling, job: JOB.scheduleAppointmentNotifications },
  ],
  'scheduling.appointment_no_show': [
    { queue: QUEUE.scheduling, job: JOB.offerWaitlistSlot },
    { queue: QUEUE.scheduling, job: JOB.scheduleAppointmentNotifications },
  ],
  'scheduling.waitlist_offer_sent': {
    queue: QUEUE.scheduling,
    job: JOB.scheduleAppointmentNotifications,
  },
  'scheduling.waitlist_offer_accepted': 'emit-only',
  'scheduling.appointment_started': 'emit-only',
  'messaging.confirmation_received': 'emit-only',
  'messaging.cancellation_received': 'emit-only',
  'messaging.waitlist_offer_accepted': 'emit-only',
  'messaging.credits_low': 'emit-only',
  'messaging.credits_exhausted': 'emit-only',
  'clinical_records.critical_alert_created': 'emit-only',
  'clinical_records.odontogram_updated': 'emit-only',
  'clinical_records.note_created': 'emit-only',
  'clinical_records.note_amended': 'emit-only',
  'clinical_records.attachment_created': {
    queue: QUEUE.platform,
    job: JOB.generateAttachmentThumbnail,
  },
  'clinical_records.anamnesis_request_sent': {
    queue: QUEUE.messaging,
    job: JOB.sendWhatsappMessage,
  },
};

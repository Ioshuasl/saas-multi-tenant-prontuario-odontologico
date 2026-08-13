import type { JobPayload } from '../../../shared/queue/job_payload.js';
import { logger } from '../../../shared/config/logger.js';
import type { RequestContext } from '../../../shared/domain/request_context.js';
import { getJobQueue } from '../../../shared/queue/job_queue_singleton.js';
import { JOB, QUEUE } from '../../../shared/queue/queue_names.js';
import { getAppointmentById } from '../scheduling_public.js';
import {
  scheduleAppointmentNotifications,
  type NotificationScheduleInput,
} from '../../messaging/messaging_public.js';

/** Consome outbox de agenda e agenda/cancela envios WhatsApp (B4). */
export async function scheduleAppointmentNotificationsJob(payload: JobPayload): Promise<void> {
  const ctx: RequestContext = {
    tenantId: payload.tenantId,
    userId: '',
    requestId: payload.requestId,
  };
  const appointmentId =
    typeof payload.appointmentId === 'string' ? payload.appointmentId : undefined;
  const eventName = payload.eventName ?? '';
  const queue = getJobQueue();

  const input: NotificationScheduleInput = {
    eventName,
    appointmentId,
    offerId: typeof payload.offerId === 'string' ? payload.offerId : undefined,
    waitlistEntryId:
      typeof payload.waitlistEntryId === 'string' ? payload.waitlistEntryId : undefined,
    patientId: typeof payload.patientId === 'string' ? payload.patientId : undefined,
    buttonPayload: typeof payload.buttonPayload === 'string' ? payload.buttonPayload : undefined,
    templateKey: typeof payload.template === 'string' ? payload.template : undefined,
  };

  if (appointmentId && eventName !== 'scheduling.waitlist_offer_sent') {
    const appointment = await getAppointmentById(ctx, appointmentId);
    if (!appointment) {
      logger.warn({ tenantId: ctx.tenantId, appointmentId }, 'schedule_notifications_appointment_missing');
      return;
    }
    input.appointmentStatus = appointment.status;
    input.startsAt = appointment.startsAt;
    input.patientId = appointment.patientId;
  }

  await scheduleAppointmentNotifications(ctx, input, {
    enqueueSend: async (jobPayload, options) => {
      await queue.add(QUEUE.messaging, JOB.sendWhatsappMessage, jobPayload, options);
    },
    cancelSend: async (jobId) => {
      await queue.remove(QUEUE.messaging, jobId);
    },
  });
}

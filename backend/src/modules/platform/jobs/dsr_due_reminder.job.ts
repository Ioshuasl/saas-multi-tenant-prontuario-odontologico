import type { JobPayload } from '../../../shared/queue/job_payload.js';
import { logger } from '../../../shared/config/logger.js';
import { getEmailProvider } from '../../../shared/integrations/email/index.js';
import { dsrReminderEmail } from '../helpers/dsr_reminder_email.helper.js';
import { addCalendarDays, formatDueDatePt, todayInTimezone } from '../helpers/dsr_due.helper.js';
import { ListDueRepository } from '../repositories/data_subject_request/data_subject_request_list_due.repository.js';
import { ListOwnerEmailsRepository } from '../repositories/data_subject_request/data_subject_request_list_owner_emails.repository.js';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function dsrDueReminderJob(payload: JobPayload): Promise<void> {
  const timezone = typeof payload.timezone === 'string' ? payload.timezone : 'America/Sao_Paulo';
  const ctx = {
    tenantId: payload.tenantId,
    userId: SYSTEM_USER_ID,
    requestId: payload.requestId,
  };

  const today = todayInTimezone(timezone);
  const inThreeDays = addCalendarDays(today, 3);
  const open = await new ListDueRepository().execute(ctx);
  const dueToday = open.filter((row) => todayInTimezone(timezone, row.dueAt) === today);
  const dueInThree = open.filter((row) => todayInTimezone(timezone, row.dueAt) === inThreeDays);
  if (dueToday.length === 0 && dueInThree.length === 0) return;

  const owners = await new ListOwnerEmailsRepository().execute(ctx);
  if (owners.length === 0) return;

  const email = getEmailProvider();
  const clinicName = owners[0]?.clinicName ?? 'Clínica';

  for (const row of dueInThree) {
    const copy = dsrReminderEmail({
      clinicName,
      kind: 'D-3',
      type: row.type,
      dueDate: formatDueDatePt(row.dueAt, timezone),
    });
    for (const owner of owners) {
      await email.send({ to: owner.email, subject: copy.subject, text: copy.text });
    }
  }
  for (const row of dueToday) {
    const copy = dsrReminderEmail({
      clinicName,
      kind: 'D-0',
      type: row.type,
      dueDate: formatDueDatePt(row.dueAt, timezone),
    });
    for (const owner of owners) {
      await email.send({ to: owner.email, subject: copy.subject, text: copy.text });
    }
  }

  logger.info(
    {
      tenantId: ctx.tenantId,
      requestId: ctx.requestId,
      d3: dueInThree.length,
      d0: dueToday.length,
    },
    'dsr_due_reminder_sent',
  );
}

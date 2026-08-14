import type { RequestContext } from '../../shared/domain/request_context.js';
import type { DbTransaction } from '../../shared/database/db_transaction.js';
import { ListFutureByPatientRepository } from './repositories/appointment/appointment.repository.js';
import { ListPatientTimelineAppointmentsRepository } from './repositories/appointment_series/appointment_series.repository.js';
import { GetService } from './services/appointment/appointment_get.service.js';
import { CreateService as AppointmentCreateService } from './services/appointment/appointment_create.service.js';
import { ConfirmService } from './services/public_booking/public_appointment_confirm.service.js';
import { StatusService } from './services/appointment/appointment_status.service.js';
import { AcceptService as WaitlistAcceptService } from './services/waitlist/waitlist_accept.service.js';
import type { AppointmentCreateSchema } from './schemas/scheduling.schema.js';
import type { AppointmentCreateOptions } from './services/appointment/appointment_create.service.js';
import {
  CreateTokenRepository,
  GetActiveTokenByTargetRepository,
  ResolveTokenByHashGlobalRepository,
  UpdateTokenRepository,
} from './repositories/public_booking_token/public_booking_token.repository.js';
import type { PublicBookingTokenMeta } from './types/public_booking.types.js';

const listFuture = new ListFutureByPatientRepository();
const getAppointment = new GetService();
const listTimeline = new ListPatientTimelineAppointmentsRepository();
const createAppointment = new AppointmentCreateService();
const confirmFromPublic = new ConfirmService();
const statusService = new StatusService();
const waitlistAccept = new WaitlistAcceptService();
const createToken = new CreateTokenRepository();
const resolveTokenGlobal = new ResolveTokenByHashGlobalRepository();
const updateToken = new UpdateTokenRepository();
const getActiveByTarget = new GetActiveTokenByTargetRepository();

/** Agendamentos futuros ativos do paciente (patients RF-E3-12). */
export async function listFutureAppointmentIds(
  ctx: RequestContext,
  patientId: string,
): Promise<string[]> {
  return listFuture.execute(ctx, patientId);
}

export async function getAppointmentById(ctx: RequestContext, appointmentId: string) {
  return getAppointment.execute(ctx, appointmentId);
}

/** Itens de agenda para timeline do paciente (RF-E3-09). */
export async function listPatientTimelineAppointments(
  ctx: RequestContext,
  patientId: string,
) {
  return listTimeline.execute(ctx, patientId);
}

export async function createFromPublic(
  ctx: RequestContext,
  appointmentSchema: AppointmentCreateSchema,
  options?: AppointmentCreateOptions,
) {
  return createAppointment.execute(ctx, appointmentSchema, null, {
    origin: 'PUBLIC_BOOKING',
    status: options?.status ?? 'REQUESTED',
    actorType: 'PATIENT',
    ...options,
  });
}

export async function confirmFromToken(requestId: string, token: string) {
  return confirmFromPublic.execute(requestId, token);
}

export async function applyWaitlistAccept(requestId: string, token: string) {
  return waitlistAccept.executeFromToken(requestId, token);
}

export async function applyWaitlistAcceptByOfferId(ctx: RequestContext, waitlistEntryId: string) {
  return waitlistAccept.executeFromOfferId(ctx, waitlistEntryId);
}

/** Inicia atendimento (SCHEDULED|CONFIRMED → IN_SERVICE). Publica `scheduling.appointment_started`. */
export async function startAppointment(ctx: RequestContext, appointmentId: string) {
  return statusService.execute(ctx, appointmentId, { status: 'IN_SERVICE' });
}

/** Botão WhatsApp CONFIRM_ → CONFIRMED (só a partir de SCHEDULED). */
export async function applyConfirmationFromPatient(ctx: RequestContext, appointmentId: string) {
  const current = await getAppointment.execute(ctx, appointmentId);
  if (!current) return null;
  if (current.status === 'CONFIRMED') return current;
  if (current.status !== 'SCHEDULED') return null;
  return statusService.execute(ctx, appointmentId, { status: 'CONFIRMED' }, { actorType: 'PATIENT' });
}

/** Botão WhatsApp CANCEL_ → cancel + waitlist via outbox. */
export async function applyCancellationFromPatient(ctx: RequestContext, appointmentId: string) {
  return statusService.execute(
    ctx,
    appointmentId,
    { status: 'CANCELLED', reason: 'paciente via WhatsApp' },
    { actorType: 'PATIENT' },
  );
}

export async function createPublicToken(
  ctx: RequestContext,
  input: {
    purpose: string;
    tokenHash: string;
    expiresAt: Date;
    targetId?: string | null;
    meta?: PublicBookingTokenMeta;
  },
  tx?: DbTransaction,
): Promise<string> {
  if (tx) return createToken.executeInTx(tx, ctx, input);
  return createToken.execute(ctx, input);
}

export async function getActivePublicToken(
  ctx: RequestContext,
  purpose: string,
  targetId: string,
) {
  return getActiveByTarget.execute(ctx, purpose, targetId);
}

export async function resolvePublicTokenByHash(tokenHash: string) {
  return resolveTokenGlobal.execute(tokenHash);
}

export async function markPublicTokenUsed(
  ctx: RequestContext,
  tokenId: string,
  tx?: DbTransaction,
): Promise<void> {
  if (tx) {
    await updateToken.executeInTx(tx, tokenId, { usedAt: new Date() });
    return;
  }
  await updateToken.execute(ctx, tokenId, { usedAt: new Date() });
}

export type {
  AppointmentSummary,
  TimelineAppointmentItem,
} from './types/scheduling.types.js';
export type { PublicBookingTokenMeta, PublicBookingTokenRow } from './types/public_booking.types.js';

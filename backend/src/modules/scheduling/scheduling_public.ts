import type { RequestContext } from '../../shared/domain/request_context.js';
import { ListFutureByPatientRepository } from './repositories/appointment/appointment.repository.js';
import { ListPatientTimelineAppointmentsRepository } from './repositories/appointment_series/appointment_series.repository.js';
import { GetService } from './services/appointment/appointment_get.service.js';

const listFuture = new ListFutureByPatientRepository();
const getAppointment = new GetService();
const listTimeline = new ListPatientTimelineAppointmentsRepository();

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

export type {
  AppointmentSummary,
  TimelineAppointmentItem,
} from './types/scheduling.types.js';

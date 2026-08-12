import type { AppointmentStatus } from '../../enum/appointment/appointment.enum.js';
import { InvalidStateTransitionError } from '../errors/scheduling.errors.js';

/** Mapa de transições válidas (RF-E4-16/17). */
const TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  REQUESTED: ['SCHEDULED', 'CANCELLED'],
  SCHEDULED: ['CONFIRMED', 'IN_SERVICE', 'NO_SHOW', 'CANCELLED'],
  CONFIRMED: ['IN_SERVICE', 'NO_SHOW', 'CANCELLED'],
  IN_SERVICE: ['COMPLETED', 'CANCELLED'],
  NO_SHOW: ['SCHEDULED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function assertTransition(
  from: AppointmentStatus,
  to: AppointmentStatus,
): void {
  if (from === to) {
    throw new InvalidStateTransitionError(from, to);
  }
  const allowed = TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new InvalidStateTransitionError(from, to);
  }
}

export function isActiveStatus(status: string): boolean {
  return status !== 'CANCELLED' && status !== 'NO_SHOW';
}

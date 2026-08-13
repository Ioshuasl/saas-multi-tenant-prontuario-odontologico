import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { appendOutboxEvent } from '../../../../shared/database/outbox.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { hashToken } from '../../../../shared/helpers/token_hash.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { InvalidStateTransitionError } from '../../models/errors/scheduling.errors.js';
import { assertTransition } from '../../models/appointment/status_machine.js';
import {
  ResolveTokenByHashGlobalRepository,
  UpdateTokenRepository,
} from '../../repositories/public_booking_token/public_booking_token.repository.js';
import {
  GetAppointmentRepository,
  UpdateAppointmentRepository,
} from '../../repositories/appointment/appointment.repository.js';
import type { AppointmentSummary } from '../../types/scheduling.types.js';
import type { AppointmentStatus } from '../../enum/appointment/appointment.enum.js';

export class ConfirmService {
  constructor(
    private readonly resolveToken = new ResolveTokenByHashGlobalRepository(),
    private readonly updateToken = new UpdateTokenRepository(),
    private readonly getAppointment = new GetAppointmentRepository(),
    private readonly updateAppointment = new UpdateAppointmentRepository(),
  ) {}

  async execute(requestId: string, rawToken: string): Promise<AppointmentSummary> {
    const token = await this.resolveToken.execute(hashToken(rawToken));
    if (!token || token.purpose !== 'CONFIRMATION') {
      throw new AppError('NOT_FOUND', 'Link inválido ou expirado.', 404);
    }
    if (token.expiresAt.getTime() < Date.now()) {
      throw new AppError('NOT_FOUND', 'Link inválido ou expirado.', 404);
    }
    if (!token.targetId) {
      throw new AppError('NOT_FOUND', 'Link inválido ou expirado.', 404);
    }

    const ctx: RequestContext = { tenantId: token.tenantId, userId: '', requestId };
    const appointment = await this.getAppointment.execute(ctx, token.targetId);
    if (!appointment) throw new AppError('NOT_FOUND', 'Agendamento não encontrado.', 404);

    if (token.usedAt) {
      return appointment;
    }

    if (appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW') {
      throw new InvalidStateTransitionError(appointment.status, 'CONFIRMED');
    }
    if (appointment.status === 'CONFIRMED') {
      await this.updateToken.execute(ctx, token.id, { usedAt: new Date() });
      return appointment;
    }

    assertTransition(appointment.status as AppointmentStatus, 'CONFIRMED');

    const updated = await this.updateAppointment.execute(
      ctx,
      appointment.id,
      { status: 'CONFIRMED', confirmedAt: new Date() },
      {
        action: 'STATUS_CHANGED',
        fromValue: { status: appointment.status },
        toValue: { status: 'CONFIRMED' },
        actorType: 'PATIENT',
      },
    );
    if (!updated) throw new AppError('NOT_FOUND', 'Agendamento não encontrado.', 404);

    await this.updateToken.execute(ctx, token.id, { usedAt: new Date() });

    await getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      await appendOutboxEvent(tx, {
        tenantId: ctx.tenantId,
        event: {
          name: 'scheduling.appointment_confirmed',
          payload: { appointmentId: updated.id, requestId },
        },
      });
    });

    return updated;
  }
}

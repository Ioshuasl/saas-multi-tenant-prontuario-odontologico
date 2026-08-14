import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import {
  IdempotencyKeyReusedError,
  PaymentAlreadyReversedError,
  PaymentNotFoundError,
  RecordImmutableError,
} from '../../models/errors/billing.errors.js';
import {
  installmentStatusAfterPaid,
  receivableStatusFromInstallments,
} from '../../models/installment_payment.model.js';
import {
  GetForPaymentRepository,
  GetPaymentRepository,
  FindByReversalIdempotencyRepository,
  ListStatusesRepository,
} from '../../repositories/payment/payment_get.repository.js';
import { ReverseRepository } from '../../repositories/payment/payment_reverse.repository.js';
import { HasOverdueRepository } from '../../repositories/installment/installment_overdue.repository.js';
import { tenantToday } from '../../helpers/tenant_today.helper.js';
import { setPatientHasOverdue } from '../../../patients/patients_public.js';
import type { PaymentReverseSchema } from '../../schemas/billing.schema.js';
import type { PaymentReverseResult } from '../../types/receivable/receivable_http.types.js';

function isIdempotencyConflict(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = String((err as { code?: string }).code ?? '');
  const message = String((err as { message?: string }).message ?? '');
  return (
    code === 'P2002' ||
    code === '23505' ||
    message.includes('uq_payment_reversal_idempotency')
  );
}

export class ReverseAction {
  constructor(
    private readonly getPayment = new GetPaymentRepository(),
    private readonly getInstallment = new GetForPaymentRepository(),
    private readonly findReversalKey = new FindByReversalIdempotencyRepository(),
    private readonly listStatuses = new ListStatusesRepository(),
    private readonly reverse = new ReverseRepository(),
    private readonly hasOverdue = new HasOverdueRepository(),
    private readonly uow = new UnitOfWork(),
  ) {}

  async execute(
    ctx: RequestContext,
    paymentId: string,
    paymentReverseSchema: PaymentReverseSchema,
    idempotencyKey: string,
  ): Promise<PaymentReverseResult> {
    const existingByKey = await this.findReversalKey.execute(ctx, idempotencyKey);
    if (existingByKey && existingByKey.id !== paymentId) {
      throw new IdempotencyKeyReusedError();
    }
    if (existingByKey) {
      if ((existingByKey.reversalReason ?? '') !== paymentReverseSchema.reason) {
        throw new IdempotencyKeyReusedError();
      }
      return {
        paymentId: existingByKey.id,
        reversedAt: existingByKey.reversedAt?.toISOString() ?? new Date().toISOString(),
        installmentStatus: existingByKey.installmentStatus,
      };
    }

    try {
      return await this.uow.run(ctx, async ({ tx, publish }) => {
        const payment = await this.getPayment.executeInTx(tx, paymentId);
        if (!payment) throw new PaymentNotFoundError();
        if (payment.reversedAt) throw new PaymentAlreadyReversedError();
        if (payment.cashSessionId && payment.cashSessionStatus === 'CLOSED') {
          throw new RecordImmutableError('Não é possível estornar pagamento de caixa já fechado.');
        }

        const installment = await this.getInstallment.executeInTx(tx, payment.installmentId);
        if (!installment) throw new PaymentNotFoundError();

        const appliedToInstallment = payment.amountCents - payment.creditGrantedCents;
        const nextPaidCents =
          installment.paidCents > appliedToInstallment
            ? installment.paidCents - appliedToInstallment
            : 0n;
        const nextInstallmentStatus = installmentStatusAfterPaid(
          installment.amountCents,
          nextPaidCents,
        );
        const lines = await this.listStatuses.executeInTx(tx, installment.receivableId);
        const nextReceivableStatus = receivableStatusFromInstallments(
          lines.map((line) => (line.id === installment.id ? nextInstallmentStatus : line.status)),
        );

        const reversedAt = new Date();
        const sessionOpen = payment.cashSessionId && payment.cashSessionStatus === 'OPEN';

        await this.reverse.executeInTx(tx, ctx, {
          paymentId: payment.id,
          installmentId: installment.id,
          receivableId: installment.receivableId,
          patientId: installment.patientId,
          reason: paymentReverseSchema.reason,
          reversedBy: ctx.userId,
          reversedAt,
          reversalIdempotencyKey: idempotencyKey,
          nextPaidCents,
          nextInstallmentStatus,
          installmentPaidAt: nextInstallmentStatus === 'PAID' ? installment.paidAt : null,
          nextReceivableStatus,
          reverseCreditGrantedCents: payment.creditGrantedCents,
          reverseCreditConsumedCents: payment.creditConsumedCents,
          cashSessionId: sessionOpen ? payment.cashSessionId : null,
          cashOut: sessionOpen
            ? payment.splits
                .filter((split) => split.method !== 'PATIENT_CREDIT')
                .map((split) => ({ amountCents: split.amountCents, method: split.method }))
            : [],
        });

        const today = await tenantToday(ctx);
        const overdue = await this.hasOverdue.executeInTx(tx, installment.patientId, today);
        await setPatientHasOverdue(ctx, installment.patientId, overdue, tx);

        publish([
          {
            name: 'billing.payment_reversed',
            payload: {
              paymentId: payment.id,
              installmentId: installment.id,
              patientId: installment.patientId,
              requestId: ctx.requestId,
            },
          },
        ]);

        return {
          paymentId: payment.id,
          reversedAt: reversedAt.toISOString(),
          installmentStatus: nextInstallmentStatus,
        };
      });
    } catch (err) {
      if (!isIdempotencyConflict(err)) throw err;
      const replay = await this.findReversalKey.execute(ctx, idempotencyKey);
      if (!replay || replay.id !== paymentId) throw new IdempotencyKeyReusedError();
      if ((replay.reversalReason ?? '') !== paymentReverseSchema.reason) {
        throw new IdempotencyKeyReusedError();
      }
      return {
        paymentId: replay.id,
        reversedAt: replay.reversedAt?.toISOString() ?? new Date().toISOString(),
        installmentStatus: replay.installmentStatus,
      };
    }
  }
}

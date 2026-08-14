import type { InstallmentStatus } from '../enum/installment/installment_status.enum.js';
import type { ReceivableStatus } from '../enum/receivable/receivable_status.enum.js';

export function installmentStatusAfterPaid(
  amountCents: bigint,
  paidCents: bigint,
): Exclude<InstallmentStatus, 'OVERDUE' | 'CANCELLED'> {
  if (paidCents <= 0n) return 'OPEN';
  if (paidCents < amountCents) return 'PARTIALLY_PAID';
  return 'PAID';
}

export function applyPaymentAmounts(
  amountCents: bigint,
  paidCents: bigint,
  paymentCents: bigint,
): { appliedCents: bigint; creditGrantedCents: bigint; nextPaidCents: bigint } {
  const remaining = amountCents - paidCents;
  const creditGrantedCents = paymentCents > remaining ? paymentCents - remaining : 0n;
  const appliedCents = paymentCents - creditGrantedCents;
  return {
    appliedCents,
    creditGrantedCents,
    nextPaidCents: paidCents + appliedCents,
  };
}

export function receivableStatusFromInstallments(
  statuses: readonly InstallmentStatus[],
): ReceivableStatus {
  if (statuses.length === 0) return 'OPEN';
  if (statuses.every((status) => status === 'CANCELLED')) return 'CANCELLED';
  const openLike = statuses.filter((status) => status !== 'CANCELLED');
  if (openLike.every((status) => status === 'PAID')) return 'PAID';
  if (openLike.some((status) => status === 'PAID' || status === 'PARTIALLY_PAID')) {
    return 'PARTIALLY_PAID';
  }
  return 'OPEN';
}

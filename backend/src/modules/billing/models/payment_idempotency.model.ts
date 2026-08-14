import type { PaymentMethod } from '../enum/payment/payment_method.enum.js';

export type PaymentSplitSnapshot = {
  method: PaymentMethod;
  amountCents: bigint;
  cardBrand: string | null;
  installmentsQty: number | null;
};

export type PaymentIdempotentPayload = {
  installmentId: string;
  amountCents: bigint;
  notes: string | null;
  splits: PaymentSplitSnapshot[];
};

function splitKey(split: PaymentSplitSnapshot): string {
  return [
    split.method,
    split.amountCents.toString(),
    split.cardBrand ?? '',
    split.installmentsQty?.toString() ?? '',
  ].join('|');
}

export function paymentPayloadMatches(
  stored: PaymentIdempotentPayload,
  incoming: PaymentIdempotentPayload,
): boolean {
  if (stored.installmentId !== incoming.installmentId) return false;
  if (stored.amountCents !== incoming.amountCents) return false;
  if ((stored.notes ?? null) !== (incoming.notes ?? null)) return false;
  if (stored.splits.length !== incoming.splits.length) return false;
  const a = [...stored.splits].map(splitKey).sort();
  const b = [...incoming.splits].map(splitKey).sort();
  return a.every((key, index) => key === b[index]);
}

export function sumSplitCents(splits: readonly { amountCents: bigint }[]): bigint {
  let total = 0n;
  for (const split of splits) total += split.amountCents;
  return total;
}

export function patientCreditCents(splits: readonly { method: string; amountCents: bigint }[]): bigint {
  let total = 0n;
  for (const split of splits) {
    if (split.method === 'PATIENT_CREDIT') total += split.amountCents;
  }
  return total;
}

export function hasCashSplit(splits: readonly { method: string }[]): boolean {
  return splits.some((split) => split.method === 'CASH');
}

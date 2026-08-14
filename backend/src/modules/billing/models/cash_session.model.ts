import type { PaymentMethod } from '../enum/payment/payment_method.enum.js';

export type MethodCents = { method: PaymentMethod; amountCents: bigint };

export type CashMovementSnapshot = {
  kind: 'SUPPLY' | 'WITHDRAWAL' | 'PAYMENT_IN' | 'PAYMENT_OUT';
  method: PaymentMethod;
  amountCents: bigint;
};

const SIGN: Record<CashMovementSnapshot['kind'], bigint> = {
  SUPPLY: 1n,
  PAYMENT_IN: 1n,
  WITHDRAWAL: -1n,
  PAYMENT_OUT: -1n,
};

export function sumMethodCents(rows: readonly MethodCents[]): bigint {
  let total = 0n;
  for (const row of rows) total += row.amountCents;
  return total;
}

export function expectedByMethod(input: {
  openingCents: bigint;
  openingByMethod: readonly MethodCents[];
  movements: readonly CashMovementSnapshot[];
}): { expectedCents: bigint; expectedByMethod: MethodCents[] } {
  const map = new Map<PaymentMethod, bigint>();
  if (input.openingByMethod.length > 0) {
    for (const row of input.openingByMethod) {
      map.set(row.method, (map.get(row.method) ?? 0n) + row.amountCents);
    }
  } else if (input.openingCents !== 0n) {
    map.set('CASH', input.openingCents);
  }

  for (const movement of input.movements) {
    const delta = SIGN[movement.kind] * movement.amountCents;
    map.set(movement.method, (map.get(movement.method) ?? 0n) + delta);
  }

  const expectedByMethodRows: MethodCents[] = [...map.entries()]
    .filter(([, amount]) => amount !== 0n)
    .map(([method, amountCents]) => ({ method, amountCents }))
    .sort((a, b) => a.method.localeCompare(b.method));

  return {
    expectedCents: sumMethodCents(expectedByMethodRows),
    expectedByMethod: expectedByMethodRows,
  };
}

export function differenceCents(countedCents: bigint, expectedCents: bigint): bigint {
  return countedCents - expectedCents;
}

export function openForHours(openedAt: Date, now: Date): number {
  return (now.getTime() - openedAt.getTime()) / 3_600_000;
}

export function methodAmountsMatch(
  a: readonly MethodCents[],
  b: readonly MethodCents[],
): boolean {
  if (a.length !== b.length) return false;
  const left = [...a]
    .map((row) => `${row.method}:${row.amountCents.toString()}`)
    .sort();
  const right = [...b]
    .map((row) => `${row.method}:${row.amountCents.toString()}`)
    .sort();
  return left.every((key, index) => key === right[index]);
}

export function closePayloadMatches(
  stored: { countedByMethod: readonly MethodCents[]; differenceReason: string | null },
  incoming: { countedByMethod: readonly MethodCents[]; differenceReason: string | null },
): boolean {
  const reasonA = stored.differenceReason?.trim() || null;
  const reasonB = incoming.differenceReason?.trim() || null;
  return reasonA === reasonB && methodAmountsMatch(stored.countedByMethod, incoming.countedByMethod);
}

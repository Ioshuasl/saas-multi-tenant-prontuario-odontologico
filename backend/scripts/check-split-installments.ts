import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import { InvalidInstallmentSplitError } from '../src/modules/billing/models/errors/billing.errors.js';
import {
  splitInstallments,
  sumCents,
} from '../src/modules/billing/helpers/split_installments.helper.js';

function assertSplit(total: bigint, n: number, down: bigint) {
  const parts = splitInstallments(total, n, down);
  assert.equal(parts.length, n);
  assert.equal(sumCents(parts) + down, total);
  const remaining = total - down;
  const base = remaining / BigInt(n);
  const residue = remaining % BigInt(n);
  assert.equal(parts[0], base + residue);
  for (let i = 1; i < n; i += 1) {
    assert.equal(parts[i], base);
  }
}

function main() {
  const cases: Array<[bigint, number, bigint]> = [
    [10000n, 3, 0n],
    [10000n, 3, 100n],
    [1n, 1, 0n],
    [0n, 1, 0n],
    [2n, 3, 0n],
    [180000n, 6, 20000n],
    [999n, 10, 9n],
    [100n, 1, 100n],
  ];

  for (const [total, n, down] of cases) {
    assertSplit(total, n, down);
  }

  for (let i = 0; i < 100; i += 1) {
    const total = BigInt(randomInt(0, 10_000_001));
    const n = randomInt(1, 37);
    const down = BigInt(randomInt(0, Number(total) + 1));
    assertSplit(total, n, down);
  }

  assert.throws(() => splitInstallments(100n, 0, 0n), InvalidInstallmentSplitError);
  assert.throws(() => splitInstallments(100n, 2, 101n), InvalidInstallmentSplitError);
  assert.throws(() => splitInstallments(-1n, 1, 0n), InvalidInstallmentSplitError);

  console.log('OK: splitInstallments invariant checks passed');
}

main();

import { InvalidInstallmentSplitError } from '../models/errors/billing.errors.js';

/**
 * Divide `totalCents - downPaymentCents` em `installmentCount` parcelas.
 * Resíduo da divisão inteira vai para a **primeira** parcela.
 * Retorno: apenas as parcelas (entrada não entra no array).
 */
export function splitInstallments(
  totalCents: bigint,
  installmentCount: number,
  downPaymentCents: bigint = 0n,
): bigint[] {
  if (!Number.isInteger(installmentCount) || installmentCount < 1) {
    throw new InvalidInstallmentSplitError('Número de parcelas deve ser ≥ 1.');
  }
  if (totalCents < 0n || downPaymentCents < 0n) {
    throw new InvalidInstallmentSplitError('Valores em centavos não podem ser negativos.');
  }
  if (downPaymentCents > totalCents) {
    throw new InvalidInstallmentSplitError('Entrada não pode exceder o total aprovado.');
  }

  const remaining = totalCents - downPaymentCents;
  const n = BigInt(installmentCount);
  const base = remaining / n;
  const residue = remaining % n;
  const amounts: bigint[] = [];
  for (let i = 0; i < installmentCount; i += 1) {
    amounts.push(i === 0 ? base + residue : base);
  }
  return amounts;
}

export function sumCents(amounts: readonly bigint[]): bigint {
  let total = 0n;
  for (const amount of amounts) {
    total += amount;
  }
  return total;
}

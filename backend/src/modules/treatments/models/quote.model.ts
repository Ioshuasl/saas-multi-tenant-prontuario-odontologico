import { allowedDiscountCents, maxDiscountPercent } from '../helpers/discount_cap.helper.js';
import { isValidFdiToothCode } from '../helpers/fdi_tooth.helper.js';
import {
  DiscountLimitExceededError,
  FaceRequiredError,
  InvalidQuoteMoneyError,
  InvalidToothCodeError,
  ProcedureInactiveError,
  ToothRequiredError,
} from './errors/treatments.errors.js';

export type ProcedurePricing = {
  id: string;
  priceCents: number;
  requiresTooth: boolean;
  requiresFace: boolean;
  active: boolean;
};

export type QuoteLineInput = {
  procedureId: string;
  toothCode?: string | null;
  face?: string | null;
  quantity: number;
  discountCents: number;
  /** Se informado, não recopia o preço do catálogo (item já persistido). */
  unitPriceCents?: number | bigint;
};

export type PricedQuoteLine = QuoteLineInput & {
  unitPriceCents: bigint;
  totalCents: bigint;
};

export type QuoteMoney = {
  subtotalCents: bigint;
  discountCents: bigint;
  totalCents: bigint;
  lines: PricedQuoteLine[];
};

export function priceQuoteLines(
  lines: QuoteLineInput[],
  procedures: ReadonlyMap<string, ProcedurePricing>,
  headerDiscountCents: number,
  role: string | undefined,
): QuoteMoney {
  const priced: PricedQuoteLine[] = [];
  let gross = 0n;
  let lineDiscounts = 0n;

  for (const line of lines) {
    const procedure = procedures.get(line.procedureId);
    if (!procedure || !procedure.active) throw new ProcedureInactiveError();
    if (procedure.requiresTooth && !line.toothCode) throw new ToothRequiredError();
    if (line.toothCode && !isValidFdiToothCode(line.toothCode)) throw new InvalidToothCodeError();
    if (procedure.requiresFace && !line.face) throw new FaceRequiredError();
    if (line.quantity < 1) throw new InvalidQuoteMoneyError('Quantidade deve ser ≥ 1.');
    if (line.discountCents < 0) throw new InvalidQuoteMoneyError();

    const unitPriceCents =
      line.unitPriceCents !== undefined ? BigInt(line.unitPriceCents) : BigInt(procedure.priceCents);
    const lineGross = unitPriceCents * BigInt(line.quantity);
    const discountCents = BigInt(line.discountCents);
    if (discountCents > lineGross) {
      throw new InvalidQuoteMoneyError('Desconto do item não pode exceder o valor bruto.');
    }
    gross += lineGross;
    lineDiscounts += discountCents;
    priced.push({
      ...line,
      unitPriceCents,
      totalCents: lineGross - discountCents,
    });
  }

  if (headerDiscountCents < 0) throw new InvalidQuoteMoneyError();
  const header = BigInt(headerDiscountCents);
  const subtotalCents = priced.reduce((acc, line) => acc + line.totalCents, 0n);
  if (header > subtotalCents) {
    throw new InvalidQuoteMoneyError('Desconto do orçamento não pode exceder o subtotal.');
  }

  const totalDiscount = lineDiscounts + header;
  const allowed = allowedDiscountCents(gross, role);
  if (allowed !== null && totalDiscount > allowed) {
    throw new DiscountLimitExceededError(maxDiscountPercent(role) ?? 0);
  }

  return {
    subtotalCents,
    discountCents: header,
    totalCents: subtotalCents - header,
    lines: priced,
  };
}

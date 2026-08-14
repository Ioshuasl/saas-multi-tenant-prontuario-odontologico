import type { QuoteDto, QuoteItemDto } from '../types/quote/quote_crud.types.js';
import type { QuoteDecisionInput } from '../types/quote/quote_decision.types.js';
import { InvalidQuoteMoneyError } from './errors/treatments.errors.js';

export type ApprovalResolution = {
  status: 'APPROVED' | 'PARTIALLY_APPROVED';
  approvedIds: string[];
  approvedTotalCents: bigint;
};

export function resolveApproval(
  items: QuoteItemDto[],
  headerDiscountCents: number,
  approvedItemIds: string[] | undefined,
): ApprovalResolution {
  const allIds = items.map((item) => item.id);
  const requested = approvedItemIds ? [...new Set(approvedItemIds)] : allIds;
  if (requested.length === 0) {
    throw new InvalidQuoteMoneyError('Aprove ao menos um item.');
  }
  const known = new Set(allIds);
  for (const id of requested) {
    if (!known.has(id)) throw new InvalidQuoteMoneyError('Item informado não pertence ao orçamento.');
  }

  const approvedSet = new Set(requested);
  const approvedItems = items.filter((item) => approvedSet.has(item.id));
  const approvedGross = approvedItems.reduce((acc, item) => acc + BigInt(item.totalCents), 0n);
  const subtotal = items.reduce((acc, item) => acc + BigInt(item.totalCents), 0n);
  const header = BigInt(headerDiscountCents);
  const headerShare = subtotal === 0n ? 0n : (header * approvedGross) / subtotal;
  const approvedTotalCents = approvedGross - headerShare;
  const status = requested.length === allIds.length ? 'APPROVED' : 'PARTIALLY_APPROVED';
  return { status, approvedIds: requested.sort(), approvedTotalCents };
}

export function sortedIds(ids: string[]): string[] {
  return [...ids].sort();
}

export function decisionMatchesQuote(quote: QuoteDto, quoteDecisionSchema: QuoteDecisionInput): boolean {
  if (quoteDecisionSchema.decision === 'REJECTED') {
    return (
      quote.status === 'REJECTED' &&
      (quote.rejectReason ?? '').trim() === (quoteDecisionSchema.reason ?? '').trim()
    );
  }

  if (quote.status !== 'APPROVED' && quote.status !== 'PARTIALLY_APPROVED') return false;
  const resolution = resolveApproval(quote.items, quote.discountCents, quoteDecisionSchema.approvedItemIds);
  if (quote.status !== resolution.status) return false;
  const persisted = sortedIds(quote.items.filter((item) => item.approved).map((item) => item.id));
  if (JSON.stringify(persisted) !== JSON.stringify(resolution.approvedIds)) return false;
  const payment = quoteDecisionSchema.payment;
  if (!quote.receivable || !payment) return false;
  const firstDue = [...quote.receivable.installments].sort((a, b) => a.number - b.number)[0]?.dueDate;
  return (
    quote.receivable.installments.length === payment.installments &&
    firstDue === payment.firstDueDate &&
    quote.receivable.downPaymentCents === (payment.downPaymentCents ?? 0) &&
    quote.receivable.totalCents === Number(resolution.approvedTotalCents)
  );
}

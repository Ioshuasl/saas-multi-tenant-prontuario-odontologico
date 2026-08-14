import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { PaymentMethod } from '../../enum/payment/payment_method.enum.js';
import type { ReceiptSnapshot } from '../../types/receipt/receipt.types.js';

export class GetPdfKeyRepository {
  async execute(ctx: RequestContext, paymentId: string): Promise<{
    id: string;
    pdfStorageKey: string | null;
  } | null> {
    const row = await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.payment.findFirst({
        where: { id: paymentId },
        select: { id: true, pdfStorageKey: true },
      }),
    );
    return row;
  }
}

export class SetPdfKeyRepository {
  async execute(ctx: RequestContext, paymentId: string, pdfStorageKey: string): Promise<void> {
    await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.payment.update({
        where: { id: paymentId },
        data: { pdfStorageKey },
      }),
    );
  }
}

export class GetReceiptRepository {
  async execute(ctx: RequestContext, paymentId: string): Promise<ReceiptSnapshot | null> {
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      const row = await tx.payment.findFirst({
        where: { id: paymentId },
        include: {
          splits: { select: { method: true, amountCents: true } },
          installment: {
            select: {
              number: true,
              receivableId: true,
              receivable: { select: { patientId: true } },
            },
          },
        },
      });
      if (!row) return null;
      const issuer = await tx.user.findUnique({
        where: { id: row.receivedBy },
        select: { name: true },
      });
      return {
        paymentId: row.id,
        unitId: row.unitId,
        patientId: row.installment.receivable.patientId,
        receivableId: row.installment.receivableId,
        installmentNumber: row.installment.number,
        amountCents: row.amountCents,
        receivedAt: row.receivedAt,
        receivedBy: row.receivedBy,
        issuerName: issuer?.name ?? 'Operador',
        receiptNumber: row.receiptNumber,
        pdfStorageKey: row.pdfStorageKey,
        splits: row.splits.map((split) => ({
          method: split.method as PaymentMethod,
          amountCents: split.amountCents,
        })),
      };
    });
  }
}

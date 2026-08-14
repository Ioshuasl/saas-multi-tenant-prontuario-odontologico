import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { SendAction } from '../../actions/payment/payment_send_receipt.action.js';
import type { ReceiptSendSchema } from '../../schemas/billing.schema.js';
import type { ReceiptSendResult } from '../../types/receipt/receipt.types.js';

export class SendService {
  constructor(private readonly send = new SendAction()) {}

  execute(
    ctx: RequestContext,
    paymentId: string,
    receiptSendSchema: ReceiptSendSchema,
  ): Promise<ReceiptSendResult> {
    return this.send.execute(ctx, paymentId, receiptSendSchema);
  }
}
